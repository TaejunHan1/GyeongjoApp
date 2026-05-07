-- ============================================================================
-- 경조사 생성 크레딧 시스템
-- ----------------------------------------------------------------------------
-- 정책:
--   - 신규/기존 사용자에게 최초 1회 10크레딧 지급
--   - 경조사 생성은 처음 2회 무료
--   - 무료 생성 2회 소진 후 청첩장/부고장 생성마다 5크레딧 사용
--   - 크레딧 지갑은 기존 users.alimtalk_balance를 공통 크레딧으로 사용
--
-- 실행 전제:
--   - database-alimtalk-credits.sql 이 먼저 적용되어 있어야 함
--   - users.alimtalk_balance, alimtalk_transactions 테이블이 있어야 함
-- ============================================================================

-- ============================================================================
-- 1. users 테이블 확장
-- ============================================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS event_creation_free_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS event_creation_welcome_seen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS event_creation_welcome_credit_granted boolean NOT NULL DEFAULT false;

-- 신규 가입자는 기본 크레딧 10개를 가진 상태로 시작
ALTER TABLE users
  ALTER COLUMN alimtalk_balance SET DEFAULT 10,
  ALTER COLUMN event_creation_welcome_credit_granted SET DEFAULT true;

COMMENT ON COLUMN users.event_creation_free_used IS
  '청첩장/부고장 무료 생성권 사용 횟수. 기본 2회까지 무료';
COMMENT ON COLUMN users.event_creation_welcome_seen IS
  '홈 화면의 경조사 생성 크레딧 안내 모달 확인 여부';
COMMENT ON COLUMN users.event_creation_welcome_credit_granted IS
  '가입/마이그레이션 환영 10크레딧 지급 여부';

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_event_creation_free_used_nonneg;
ALTER TABLE users
  ADD CONSTRAINT users_event_creation_free_used_nonneg
  CHECK (event_creation_free_used >= 0);

-- 기존 사용자에게도 최초 1회 10크레딧 지급
UPDATE users
   SET alimtalk_balance = COALESCE(alimtalk_balance, 0) + 10,
       event_creation_welcome_credit_granted = true
 WHERE event_creation_welcome_credit_granted = false;

INSERT INTO alimtalk_transactions
  (user_id, type, credits_change, balance_after, memo)
SELECT id, 'charge', 10, COALESCE(alimtalk_balance, 10), 'event_creation_welcome_credit'
  FROM users
 WHERE event_creation_welcome_credit_granted = true
   AND NOT EXISTS (
     SELECT 1
       FROM alimtalk_transactions t
      WHERE t.user_id = users.id
        AND t.memo = 'event_creation_welcome_credit'
   );


DROP TRIGGER IF EXISTS trg_grant_event_creation_welcome_credit ON users;
DROP FUNCTION IF EXISTS grant_event_creation_welcome_credit();


-- ============================================================================
-- 2. 현재 경조사 생성 크레딧 상태 조회
-- ============================================================================
CREATE OR REPLACE FUNCTION get_event_creation_credit_state(
  p_user_id uuid,
  p_free_limit integer DEFAULT 2,
  p_price_credits integer DEFAULT 5
) RETURNS TABLE (
  success boolean,
  balance integer,
  free_used integer,
  free_remaining integer,
  price_credits integer,
  welcome_seen boolean,
  error text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user users%ROWTYPE;
BEGIN
  SELECT * INTO v_user
    FROM users
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, 0, p_price_credits, false, 'user_not_found'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    true,
    COALESCE(v_user.alimtalk_balance, 0),
    COALESCE(v_user.event_creation_free_used, 0),
    GREATEST(p_free_limit - COALESCE(v_user.event_creation_free_used, 0), 0),
    p_price_credits,
    COALESCE(v_user.event_creation_welcome_seen, false),
    NULL::text;
END;
$$;


-- ============================================================================
-- 3. 경조사 생성 전 무료권/크레딧 예약
-- ============================================================================
CREATE OR REPLACE FUNCTION consume_event_creation_credit(
  p_user_id uuid,
  p_event_type text,
  p_price_credits integer DEFAULT 5,
  p_free_limit integer DEFAULT 2
) RETURNS TABLE (
  success boolean,
  payment_method text,
  new_balance integer,
  free_used integer,
  free_remaining integer,
  price_credits integer,
  error text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user users%ROWTYPE;
  v_balance integer;
  v_free_used integer;
BEGIN
  IF p_event_type NOT IN ('wedding', 'funeral') THEN
    RETURN QUERY SELECT false, NULL::text, 0, 0, 0, p_price_credits, 'unsupported_event_type'::text;
    RETURN;
  END IF;

  SELECT * INTO v_user
    FROM users
   WHERE id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text, 0, 0, 0, p_price_credits, 'user_not_found'::text;
    RETURN;
  END IF;

  IF COALESCE(v_user.event_creation_free_used, 0) < p_free_limit THEN
    UPDATE users
       SET event_creation_free_used = COALESCE(event_creation_free_used, 0) + 1
     WHERE id = p_user_id
     RETURNING COALESCE(alimtalk_balance, 0), event_creation_free_used
      INTO v_balance, v_free_used;

    INSERT INTO alimtalk_transactions
      (user_id, type, credits_change, balance_after, memo)
    VALUES
      (p_user_id, 'adjust', 0, v_balance, 'event_creation_free:' || p_event_type);

    RETURN QUERY SELECT
      true,
      'free'::text,
      v_balance,
      v_free_used,
      GREATEST(p_free_limit - v_free_used, 0),
      p_price_credits,
      NULL::text;
    RETURN;
  END IF;

  UPDATE users
     SET alimtalk_balance = COALESCE(alimtalk_balance, 0) - p_price_credits
   WHERE id = p_user_id
     AND COALESCE(alimtalk_balance, 0) >= p_price_credits
   RETURNING COALESCE(alimtalk_balance, 0), COALESCE(event_creation_free_used, 0)
    INTO v_balance, v_free_used;

  IF v_balance IS NULL THEN
    RETURN QUERY SELECT
      false,
      NULL::text,
      COALESCE(v_user.alimtalk_balance, 0),
      COALESCE(v_user.event_creation_free_used, 0),
      GREATEST(p_free_limit - COALESCE(v_user.event_creation_free_used, 0), 0),
      p_price_credits,
      'insufficient_balance'::text;
    RETURN;
  END IF;

  INSERT INTO alimtalk_transactions
    (user_id, type, credits_change, balance_after, memo)
  VALUES
    (p_user_id, 'adjust', -p_price_credits, v_balance, 'event_creation_credit:' || p_event_type);

  RETURN QUERY SELECT
    true,
    'credit'::text,
    v_balance,
    v_free_used,
    GREATEST(p_free_limit - v_free_used, 0),
    p_price_credits,
    NULL::text;
END;
$$;


-- ============================================================================
-- 4. 이벤트 생성 실패 시 예약 되돌리기
-- ============================================================================
CREATE OR REPLACE FUNCTION refund_event_creation_credit(
  p_user_id uuid,
  p_payment_method text,
  p_price_credits integer DEFAULT 5,
  p_reason text DEFAULT 'event_create_failed'
) RETURNS TABLE (
  success boolean,
  new_balance integer,
  free_used integer
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance integer;
  v_free_used integer;
BEGIN
  IF p_payment_method = 'free' THEN
    UPDATE users
       SET event_creation_free_used = GREATEST(COALESCE(event_creation_free_used, 0) - 1, 0)
     WHERE id = p_user_id
     RETURNING COALESCE(alimtalk_balance, 0), event_creation_free_used
      INTO v_balance, v_free_used;

    INSERT INTO alimtalk_transactions
      (user_id, type, credits_change, balance_after, memo)
    VALUES
      (p_user_id, 'adjust', 0, v_balance, p_reason || ':free_refund');

    RETURN QUERY SELECT true, v_balance, v_free_used;
    RETURN;
  END IF;

  IF p_payment_method = 'credit' THEN
    UPDATE users
       SET alimtalk_balance = COALESCE(alimtalk_balance, 0) + p_price_credits
     WHERE id = p_user_id
     RETURNING COALESCE(alimtalk_balance, 0), COALESCE(event_creation_free_used, 0)
      INTO v_balance, v_free_used;

    INSERT INTO alimtalk_transactions
      (user_id, type, credits_change, balance_after, memo)
    VALUES
      (p_user_id, 'refund', p_price_credits, v_balance, p_reason || ':credit_refund');

    RETURN QUERY SELECT true, v_balance, v_free_used;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 0, 0;
END;
$$;


-- ============================================================================
-- 5. 홈 안내 모달 확인 처리
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_event_creation_welcome_seen(
  p_user_id uuid
) RETURNS TABLE (
  success boolean,
  welcome_seen boolean,
  error text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_seen boolean;
BEGIN
  UPDATE users
     SET event_creation_welcome_seen = true
   WHERE id = p_user_id
   RETURNING event_creation_welcome_seen INTO v_seen;

  IF v_seen IS NULL THEN
    RETURN QUERY SELECT false, false, 'user_not_found'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_seen, NULL::text;
END;
$$;


-- ============================================================================
-- 6. RPC 권한
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_event_creation_credit_state(uuid, integer, integer)
  TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION consume_event_creation_credit(uuid, text, integer, integer)
  TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION refund_event_creation_credit(uuid, text, integer, text)
  TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION mark_event_creation_welcome_seen(uuid)
  TO authenticated, anon, service_role;
