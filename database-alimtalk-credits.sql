-- ============================================================================
-- 카카오 알림톡 크레딧 시스템 스키마
-- ----------------------------------------------------------------------------
-- 요약:
--   - 유저 지갑 방식으로 알림톡 발송 크레딧 관리 (건 단위)
--   - 행사별로 자동 발송 ON/OFF 토글
--   - IAP(Apple/Google) 영수증 기반 충전
--   - 동시성 안전: 차감은 RPC + FOR UPDATE 락으로 원자적 처리
-- ============================================================================


-- ============================================================================
-- 1. users 테이블 확장
-- ============================================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS alimtalk_balance integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN users.alimtalk_balance IS '카카오 알림톡 발송 가능 건수 (크레딧)';

-- 음수 방지 제약
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_alimtalk_balance_nonneg;
ALTER TABLE users
  ADD CONSTRAINT users_alimtalk_balance_nonneg
  CHECK (alimtalk_balance >= 0);


-- ============================================================================
-- 2. events 테이블 확장
-- ============================================================================
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS alimtalk_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN events.alimtalk_enabled IS '이 행사에서 부조 접수 시 카카오 알림톡 자동 발송 여부';


-- ============================================================================
-- 3. alimtalk_packages — 판매 상품 정의
-- ============================================================================
CREATE TABLE IF NOT EXISTS alimtalk_packages (
  id                 text PRIMARY KEY,             -- 'pack_125', 'pack_400', ...
  name               text NOT NULL,
  description        text,
  price_krw          integer NOT NULL,             -- 원
  credits            integer NOT NULL,             -- 기본 건수
  bonus_credits      integer NOT NULL DEFAULT 0,   -- 보너스 건수
  apple_product_id   text UNIQUE,                  -- Apple IAP product ID
  google_product_id  text UNIQUE,                  -- Google IAP product ID
  is_active          boolean NOT NULL DEFAULT true,
  is_recommended     boolean NOT NULL DEFAULT false,
  sort_order         integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE alimtalk_packages IS '알림톡 크레딧 충전 패키지';

-- 초기 시드 데이터 (단가 80원 가정, 패키지 클수록 보너스)
INSERT INTO alimtalk_packages
  (id, name, description, price_krw, credits, bonus_credits, apple_product_id, google_product_id, is_recommended, sort_order)
VALUES
  ('pack_125', '기본',   '결혼식/장례식 1회 소규모',  10000, 125, 0,   'alimtalk_pack_125', 'alimtalk_pack_125', false, 1),
  ('pack_400', '추천',   '보너스 100건 포함',        30000, 300, 100, 'alimtalk_pack_400', 'alimtalk_pack_400', true,  2),
  ('pack_700', '대용량', '보너스 200건 포함',        50000, 500, 200, 'alimtalk_pack_700', 'alimtalk_pack_700', false, 3),
  ('pack_1250', '방명록', '하객 접수 행사 이용권 1회 기준', 100000, 1250, 0, 'alimtalk_pack_1250', 'alimtalk_pack_1250', false, 4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_krw = EXCLUDED.price_krw,
  credits = EXCLUDED.credits,
  bonus_credits = EXCLUDED.bonus_credits,
  is_recommended = EXCLUDED.is_recommended,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();


-- ============================================================================
-- 4. alimtalk_transactions — 거래 원장 (충전 / 발송 / 환불)
-- ============================================================================
CREATE TABLE IF NOT EXISTS alimtalk_transactions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              text NOT NULL CHECK (type IN ('charge', 'send', 'refund', 'adjust')),
  credits_change    integer NOT NULL,         -- 양수: 충전/환불, 음수: 발송
  balance_after     integer NOT NULL,         -- 트랜잭션 직후 잔액(감사용)

  -- 관련 엔터티 (nullable)
  event_id          uuid REFERENCES events(id) ON DELETE SET NULL,
  contribution_id   uuid,                     -- guest_book.id (웹에서 기록)
  package_id        text REFERENCES alimtalk_packages(id),

  -- 결제 검증 (IAP)
  payment_platform  text CHECK (payment_platform IN ('apple', 'google', 'manual')),
  payment_receipt   text,                     -- 애플/구글 영수증 토큰
  payment_tx_id     text,                     -- 원타임 트랜잭션 ID (중복 방지)

  memo              text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE alimtalk_transactions IS '알림톡 크레딧 거래 내역';

-- IAP 중복 처리 방지 (같은 결제 영수증을 두 번 반영하면 안 됨)
CREATE UNIQUE INDEX IF NOT EXISTS alimtalk_tx_platform_txid_unique
  ON alimtalk_transactions (payment_platform, payment_tx_id)
  WHERE payment_tx_id IS NOT NULL;

-- 조회 인덱스
CREATE INDEX IF NOT EXISTS alimtalk_tx_user_created_idx
  ON alimtalk_transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS alimtalk_tx_event_idx
  ON alimtalk_transactions (event_id)
  WHERE event_id IS NOT NULL;


-- ============================================================================
-- 5. RPC: 알림톡 크레딧 충전 (IAP 영수증 검증 후 호출)
--    - 중복 결제 방지 (payment_tx_id unique)
--    - 원자적으로 잔액 업데이트 + 거래 기록
-- ============================================================================
CREATE OR REPLACE FUNCTION charge_alimtalk_credits(
  p_user_id         uuid,
  p_package_id      text,
  p_payment_platform text,
  p_payment_tx_id   text,
  p_payment_receipt text DEFAULT NULL
) RETURNS TABLE (
  success      boolean,
  new_balance  integer,
  credits_added integer,
  error        text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_pack    alimtalk_packages%ROWTYPE;
  v_total   integer;
  v_balance integer;
BEGIN
  -- 1) 패키지 조회
  SELECT * INTO v_pack FROM alimtalk_packages
    WHERE id = p_package_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, 'package_not_found'::text;
    RETURN;
  END IF;

  v_total := v_pack.credits + v_pack.bonus_credits;

  -- 2) 유저 행 잠금 + 잔액 업데이트 (원자적)
  UPDATE users
     SET alimtalk_balance = alimtalk_balance + v_total
   WHERE id = p_user_id
  RETURNING alimtalk_balance INTO v_balance;

  IF v_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, 'user_not_found'::text;
    RETURN;
  END IF;

  -- 3) 거래 기록 (payment_tx_id 중복 시 unique 제약으로 실패)
  BEGIN
    INSERT INTO alimtalk_transactions
      (user_id, type, credits_change, balance_after, package_id,
       payment_platform, payment_receipt, payment_tx_id)
    VALUES
      (p_user_id, 'charge', v_total, v_balance, p_package_id,
       p_payment_platform, p_payment_receipt, p_payment_tx_id);
  EXCEPTION WHEN unique_violation THEN
    -- 이미 처리된 결제 → 잔액 롤백
    UPDATE users
       SET alimtalk_balance = alimtalk_balance - v_total
     WHERE id = p_user_id;
    RETURN QUERY SELECT false, v_balance - v_total, 0, 'duplicate_payment'::text;
    RETURN;
  END;

  RETURN QUERY SELECT true, v_balance, v_total, NULL::text;
END;
$$;


-- ============================================================================
-- 6. RPC: 알림톡 크레딧 차감 (발송 직전에 호출)
--    - 잔액 부족 시 즉시 실패 반환 (발송 취소 판단용)
--    - 성공 시 balance -1 + send 트랜잭션 기록
-- ============================================================================
CREATE OR REPLACE FUNCTION deduct_alimtalk_credit(
  p_user_id         uuid,
  p_event_id        uuid,
  p_contribution_id uuid
) RETURNS TABLE (
  success      boolean,
  new_balance  integer,
  error        text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance integer;
BEGIN
  -- 잔액 부족하지 않을 때만 차감 (원자적)
  UPDATE users
     SET alimtalk_balance = alimtalk_balance - 1
   WHERE id = p_user_id
     AND alimtalk_balance > 0
  RETURNING alimtalk_balance INTO v_balance;

  IF v_balance IS NULL THEN
    -- 유저 없거나 잔액 0
    SELECT alimtalk_balance INTO v_balance FROM users WHERE id = p_user_id;
    IF v_balance IS NULL THEN
      RETURN QUERY SELECT false, 0, 'user_not_found'::text;
    ELSE
      RETURN QUERY SELECT false, v_balance, 'insufficient_balance'::text;
    END IF;
    RETURN;
  END IF;

  INSERT INTO alimtalk_transactions
    (user_id, type, credits_change, balance_after, event_id, contribution_id)
  VALUES
    (p_user_id, 'send', -1, v_balance, p_event_id, p_contribution_id);

  RETURN QUERY SELECT true, v_balance, NULL::text;
END;
$$;


-- ============================================================================
-- 7. RPC: 발송 실패 시 크레딧 환불
-- ============================================================================
CREATE OR REPLACE FUNCTION refund_alimtalk_credit(
  p_user_id         uuid,
  p_event_id        uuid,
  p_contribution_id uuid,
  p_reason          text DEFAULT 'send_failed'
) RETURNS TABLE (
  success     boolean,
  new_balance integer
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance integer;
BEGIN
  UPDATE users
     SET alimtalk_balance = alimtalk_balance + 1
   WHERE id = p_user_id
  RETURNING alimtalk_balance INTO v_balance;

  INSERT INTO alimtalk_transactions
    (user_id, type, credits_change, balance_after, event_id, contribution_id, memo)
  VALUES
    (p_user_id, 'refund', 1, v_balance, p_event_id, p_contribution_id, p_reason);

  RETURN QUERY SELECT true, v_balance;
END;
$$;


-- ============================================================================
-- 8. RLS 정책
-- ============================================================================
ALTER TABLE alimtalk_packages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE alimtalk_transactions ENABLE ROW LEVEL SECURITY;

-- 패키지: 모두 조회 가능 (비활성은 클라이언트에서 필터링)
DROP POLICY IF EXISTS alimtalk_packages_select_all ON alimtalk_packages;
CREATE POLICY alimtalk_packages_select_all ON alimtalk_packages
  FOR SELECT USING (true);

-- 거래내역: 본인 것만 조회
DROP POLICY IF EXISTS alimtalk_tx_select_own ON alimtalk_transactions;
CREATE POLICY alimtalk_tx_select_own ON alimtalk_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT/UPDATE는 막고 RPC 함수(SECURITY DEFINER)로만 허용
-- (클라이언트가 직접 잔액을 조작할 수 없게 하기 위함)


-- ============================================================================
-- 9. 편의 뷰: 행사별 알림톡 사용 현황
-- ============================================================================
CREATE OR REPLACE VIEW event_alimtalk_usage AS
SELECT
  e.id              AS event_id,
  e.event_name,
  e.alimtalk_enabled,
  COUNT(t.id) FILTER (WHERE t.type = 'send')           AS sent_count,
  COUNT(t.id) FILTER (WHERE t.type = 'refund')         AS refund_count,
  COALESCE(SUM(CASE WHEN t.type = 'send'   THEN -t.credits_change ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN t.type = 'refund' THEN  t.credits_change ELSE 0 END), 0)
    AS net_credits_used
FROM events e
LEFT JOIN alimtalk_transactions t ON t.event_id = e.id
GROUP BY e.id;

COMMENT ON VIEW event_alimtalk_usage IS '행사별 알림톡 발송 통계';


-- ============================================================================
-- 설치 완료 확인
-- ============================================================================
-- 아래를 Supabase SQL Editor에서 실행하면 현재 상태를 확인할 수 있음
--
-- SELECT id, name, price_krw, credits + bonus_credits AS total_credits,
--        is_recommended FROM alimtalk_packages ORDER BY sort_order;
--
-- SELECT alimtalk_balance FROM users WHERE id = auth.uid();
--
-- SELECT * FROM event_alimtalk_usage WHERE event_id = '<event-id>';
