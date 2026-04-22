-- ============================================================================
-- AI 추천 크레딧 시스템 (알림톡 크레딧 지갑 공용)
-- ----------------------------------------------------------------------------
-- - 기능별 "첫 1회 무료" 체험 (users.ai_free_used JSONB)
-- - 무료 횟수 소진 후에는 기존 alimtalk_balance 에서 1건씩 차감
-- - 거래 내역은 alimtalk_transactions 에 type='send' + memo='AI:<feature>' 로 기록
-- ----------------------------------------------------------------------------
-- 실행 방법: Supabase SQL Editor에 이 파일 전체를 붙여넣기
-- ============================================================================


-- ============================================================================
-- 1. users 테이블: ai_free_used 컬럼 추가
--    - { "budget": true, "money": true, ... } 형태
--    - 해당 feature 키가 true 면 무료 체험 이미 사용한 것
-- ============================================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ai_free_used jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN users.ai_free_used IS
  'AI 기능별 무료 체험 사용 여부. 키: feature 이름 (budget/money 등), 값: true=이미 사용';


-- ============================================================================
-- 2. RPC: consume_ai_credit
--    - 반환: (success, used_free, new_balance, error)
--    - 흐름:
--       a) 유저 존재 확인
--       b) ai_free_used->feature 이 true 가 아니면 → 무료 처리, 해당 키를 true 로 세팅
--       c) 이미 무료 소진 → alimtalk_balance 1 차감, 부족 시 insufficient_balance 반환
--       d) 성공 시 alimtalk_transactions 에 send 기록 (memo='AI:<feature>')
-- ============================================================================
CREATE OR REPLACE FUNCTION consume_ai_credit(
  p_user_id  uuid,
  p_feature  text              -- 'budget' | 'money' | (확장 가능)
) RETURNS TABLE (
  success      boolean,
  used_free    boolean,
  new_balance  integer,
  error        text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user       users%ROWTYPE;
  v_balance    integer;
  v_already    boolean;
BEGIN
  -- feature 이름 검증 (최소한의 방어)
  IF p_feature IS NULL OR length(trim(p_feature)) = 0 THEN
    RETURN QUERY SELECT false, false, 0, 'invalid_feature'::text;
    RETURN;
  END IF;

  -- 유저 조회
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 0, 'user_not_found'::text;
    RETURN;
  END IF;

  -- 해당 feature 를 이미 무료로 써봤는지
  v_already := COALESCE((v_user.ai_free_used ->> p_feature)::boolean, false);

  -- (b) 무료 체험 경로
  IF NOT v_already THEN
    UPDATE users
       SET ai_free_used = ai_free_used || jsonb_build_object(p_feature, true)
     WHERE id = p_user_id;

    -- 무료 체험도 감사 기록 남김 (0건 변동 / memo='AI:<feature>:free')
    INSERT INTO alimtalk_transactions
      (user_id, type, credits_change, balance_after, memo)
    VALUES
      (p_user_id, 'adjust', 0, v_user.alimtalk_balance,
       'AI:' || p_feature || ':free');

    RETURN QUERY SELECT true, true, v_user.alimtalk_balance, NULL::text;
    RETURN;
  END IF;

  -- (c) 유료 차감 경로 - 원자적 UPDATE
  UPDATE users
     SET alimtalk_balance = alimtalk_balance - 1
   WHERE id = p_user_id
     AND alimtalk_balance > 0
  RETURNING alimtalk_balance INTO v_balance;

  IF v_balance IS NULL THEN
    -- 잔액 0 또는 음수 방지 실패
    RETURN QUERY SELECT false, false, v_user.alimtalk_balance,
                        'insufficient_balance'::text;
    RETURN;
  END IF;

  -- (d) 거래 내역 기록 (type='send' 재사용, memo 로 AI 호출 구분)
  INSERT INTO alimtalk_transactions
    (user_id, type, credits_change, balance_after, memo)
  VALUES
    (p_user_id, 'send', -1, v_balance, 'AI:' || p_feature);

  RETURN QUERY SELECT true, false, v_balance, NULL::text;
END;
$$;


-- ============================================================================
-- 3. RPC: refund_ai_credit
--    - AI 호출이 서버 에러 등으로 실패했을 때 되돌림
--    - 무료 체험이 소비된 경우: ai_free_used[feature] 을 false 로 복원
--    - 크레딧이 차감된 경우: balance +1 + refund 트랜잭션 기록
-- ============================================================================
CREATE OR REPLACE FUNCTION refund_ai_credit(
  p_user_id   uuid,
  p_feature   text,
  p_was_free  boolean,
  p_reason    text DEFAULT 'ai_call_failed'
) RETURNS TABLE (
  success     boolean,
  new_balance integer
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_was_free THEN
    -- 무료 체험 복원
    UPDATE users
       SET ai_free_used = ai_free_used - p_feature
     WHERE id = p_user_id
    RETURNING alimtalk_balance INTO v_balance;

    INSERT INTO alimtalk_transactions
      (user_id, type, credits_change, balance_after, memo)
    VALUES
      (p_user_id, 'adjust', 0, COALESCE(v_balance, 0),
       'AI:' || p_feature || ':free_refund:' || p_reason);

    RETURN QUERY SELECT true, COALESCE(v_balance, 0);
    RETURN;
  END IF;

  -- 유료 크레딧 환불
  UPDATE users
     SET alimtalk_balance = alimtalk_balance + 1
   WHERE id = p_user_id
  RETURNING alimtalk_balance INTO v_balance;

  IF v_balance IS NULL THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  INSERT INTO alimtalk_transactions
    (user_id, type, credits_change, balance_after, memo)
  VALUES
    (p_user_id, 'refund', 1, v_balance, 'AI:' || p_feature || ':' || p_reason);

  RETURN QUERY SELECT true, v_balance;
END;
$$;


-- ============================================================================
-- 4. 읽기 편의 뷰: 무료 체험 여부 + 현재 잔액을 한 번에 조회
-- ============================================================================
CREATE OR REPLACE VIEW v_user_ai_status AS
SELECT
  u.id                                              AS user_id,
  u.alimtalk_balance                                AS balance,
  COALESCE((u.ai_free_used ->> 'budget')::boolean, false) AS budget_free_used,
  COALESCE((u.ai_free_used ->> 'money')::boolean,  false) AS money_free_used
FROM users u;

COMMENT ON VIEW v_user_ai_status IS
  '각 유저의 크레딧 잔액 + AI 기능별 무료 체험 사용 여부';


-- ============================================================================
-- 5. 권한: authenticated 롤이 RPC 호출할 수 있도록
-- ============================================================================
GRANT EXECUTE ON FUNCTION consume_ai_credit(uuid, text)               TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION refund_ai_credit(uuid, text, boolean, text) TO authenticated, anon, service_role;
GRANT SELECT ON v_user_ai_status                                      TO authenticated, anon, service_role;
