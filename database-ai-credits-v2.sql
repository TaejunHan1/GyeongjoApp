-- ============================================================================
-- AI 추천 크레딧 시스템 v2
-- ----------------------------------------------------------------------------
-- 변경점:
--  - consume_ai_credit / refund_ai_credit 에 p_cost (기본 1) 파라미터 추가
--  - 기능별 차등 과금 지원 (예산계산 5건, 축의금 3건)
--  - 무료 체험은 여전히 첫 회 0건으로 제공
--  - DROP 후 재생성 (파라미터 추가라 signature 가 바뀌므로)
-- ----------------------------------------------------------------------------
-- 실행: Supabase SQL Editor 에서 이 파일 전체 붙여넣기
-- 이미 v1 가 실행되어 있는 상태에서 이어 실행하면 됨
-- ============================================================================


-- 이전 버전 제거
DROP FUNCTION IF EXISTS consume_ai_credit(uuid, text);
DROP FUNCTION IF EXISTS refund_ai_credit(uuid, text, boolean, text);


-- ============================================================================
-- consume_ai_credit(user, feature, cost)
-- ----------------------------------------------------------------------------
-- 반환 TABLE: (success boolean, used_free boolean, new_balance integer, error text)
--  - p_cost: 차감할 크레딧 수. 무료 체험이 가능한 경우엔 cost 와 무관하게 0 건 처리
-- ============================================================================
CREATE OR REPLACE FUNCTION consume_ai_credit(
  p_user_id  uuid,
  p_feature  text,
  p_cost     integer DEFAULT 1
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
  v_cost       integer;
BEGIN
  -- 입력 검증
  IF p_feature IS NULL OR length(trim(p_feature)) = 0 THEN
    RETURN QUERY SELECT false, false, 0, 'invalid_feature'::text;
    RETURN;
  END IF;

  v_cost := COALESCE(p_cost, 1);
  IF v_cost < 1 THEN v_cost := 1; END IF;

  -- 유저 조회
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 0, 'user_not_found'::text;
    RETURN;
  END IF;

  v_already := COALESCE((v_user.ai_free_used ->> p_feature)::boolean, false);

  -- 무료 체험 경로
  IF NOT v_already THEN
    UPDATE users
       SET ai_free_used = ai_free_used || jsonb_build_object(p_feature, true)
     WHERE id = p_user_id;

    INSERT INTO alimtalk_transactions
      (user_id, type, credits_change, balance_after, memo)
    VALUES
      (p_user_id, 'adjust', 0, v_user.alimtalk_balance,
       'AI:' || p_feature || ':free');

    RETURN QUERY SELECT true, true, v_user.alimtalk_balance, NULL::text;
    RETURN;
  END IF;

  -- 유료 차감 경로 (원자적 UPDATE, 잔액 충분할 때만 차감)
  UPDATE users
     SET alimtalk_balance = alimtalk_balance - v_cost
   WHERE id = p_user_id
     AND alimtalk_balance >= v_cost
  RETURNING alimtalk_balance INTO v_balance;

  IF v_balance IS NULL THEN
    RETURN QUERY SELECT false, false, v_user.alimtalk_balance,
                        'insufficient_balance'::text;
    RETURN;
  END IF;

  INSERT INTO alimtalk_transactions
    (user_id, type, credits_change, balance_after, memo)
  VALUES
    (p_user_id, 'send', -v_cost, v_balance, 'AI:' || p_feature);

  RETURN QUERY SELECT true, false, v_balance, NULL::text;
END;
$$;


-- ============================================================================
-- refund_ai_credit(user, feature, was_free, cost, reason)
-- ----------------------------------------------------------------------------
-- AI 호출이 서버에서 실패했을 때 되돌림
--  - was_free=true  → ai_free_used[feature] 을 복원 (cost 무시)
--  - was_free=false → balance + cost (기본 1) + refund 트랜잭션 기록
-- ============================================================================
CREATE OR REPLACE FUNCTION refund_ai_credit(
  p_user_id   uuid,
  p_feature   text,
  p_was_free  boolean,
  p_cost      integer DEFAULT 1,
  p_reason    text DEFAULT 'ai_call_failed'
) RETURNS TABLE (
  success     boolean,
  new_balance integer
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance integer;
  v_cost    integer;
BEGIN
  v_cost := COALESCE(p_cost, 1);
  IF v_cost < 1 THEN v_cost := 1; END IF;

  IF p_was_free THEN
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
     SET alimtalk_balance = alimtalk_balance + v_cost
   WHERE id = p_user_id
  RETURNING alimtalk_balance INTO v_balance;

  IF v_balance IS NULL THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  INSERT INTO alimtalk_transactions
    (user_id, type, credits_change, balance_after, memo)
  VALUES
    (p_user_id, 'refund', v_cost, v_balance, 'AI:' || p_feature || ':' || p_reason);

  RETURN QUERY SELECT true, v_balance;
END;
$$;


-- 권한 재부여 (함수 DROP 시 권한도 사라짐)
GRANT EXECUTE ON FUNCTION consume_ai_credit(uuid, text, integer)               TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION refund_ai_credit(uuid, text, boolean, integer, text) TO authenticated, anon, service_role;
