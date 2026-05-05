-- ============================================================================
-- 하객 접수 행사 이용권 시스템
-- ----------------------------------------------------------------------------
-- - 행사(event_id)당 최초 1회만 크레딧 차감
-- - 신랑측/신부측 접수대를 모두 포함
-- - 같은 행사에 다시 입장할 때는 추가 차감 없음
-- - users.alimtalk_balance 공용 크레딧 지갑 사용
-- ============================================================================

CREATE TABLE IF NOT EXISTS guestbook_event_unlocks (
  event_id       uuid PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  paid_by        uuid REFERENCES users(id) ON DELETE SET NULL,
  price_credits  integer NOT NULL DEFAULT 1250,
  unlocked_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE guestbook_event_unlocks IS '하객 접수 행사 단위 이용권 활성화 내역';

CREATE INDEX IF NOT EXISTS guestbook_event_unlocks_paid_by_idx
  ON guestbook_event_unlocks (paid_by, unlocked_at DESC);


CREATE OR REPLACE FUNCTION get_guestbook_event_access_state(
  p_event_id uuid
) RETURNS TABLE (
  unlocked      boolean,
  price_credits integer,
  unlocked_at   timestamptz
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_unlock guestbook_event_unlocks%ROWTYPE;
BEGIN
  SELECT * INTO v_unlock
    FROM guestbook_event_unlocks
   WHERE event_id = p_event_id;

  IF FOUND THEN
    RETURN QUERY SELECT true, v_unlock.price_credits, v_unlock.unlocked_at;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 1250, NULL::timestamptz;
END;
$$;


CREATE OR REPLACE FUNCTION unlock_guestbook_event_access(
  p_user_id       uuid,
  p_event_id      uuid,
  p_price_credits integer DEFAULT 1250
) RETURNS TABLE (
  success          boolean,
  new_balance      integer,
  already_unlocked boolean,
  error            text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance integer;
  v_cost    integer;
  v_owned   boolean;
BEGIN
  IF p_event_id IS NULL THEN
    RETURN QUERY SELECT false, 0, false, 'missing_event_id'::text;
    RETURN;
  END IF;

  v_cost := GREATEST(COALESCE(p_price_credits, 1250), 0);

  SELECT EXISTS (
    SELECT 1 FROM guestbook_event_unlocks WHERE event_id = p_event_id
  ) INTO v_owned;

  SELECT alimtalk_balance INTO v_balance FROM users WHERE id = p_user_id;
  IF v_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, false, 'user_not_found'::text;
    RETURN;
  END IF;

  IF v_owned THEN
    RETURN QUERY SELECT true, v_balance, true, NULL::text;
    RETURN;
  END IF;

  UPDATE users
     SET alimtalk_balance = alimtalk_balance - v_cost
   WHERE id = p_user_id
     AND alimtalk_balance >= v_cost
  RETURNING alimtalk_balance INTO v_balance;

  IF v_balance IS NULL THEN
    SELECT alimtalk_balance INTO v_balance FROM users WHERE id = p_user_id;
    RETURN QUERY SELECT false, COALESCE(v_balance, 0), false, 'insufficient_balance'::text;
    RETURN;
  END IF;

  INSERT INTO guestbook_event_unlocks
    (event_id, paid_by, price_credits)
  VALUES
    (p_event_id, p_user_id, v_cost)
  ON CONFLICT (event_id) DO NOTHING;

  -- 동시에 두 기기에서 누른 경우: 이미 다른 요청이 먼저 활성화했다면 차감분 환불
  IF NOT FOUND THEN
    UPDATE users
       SET alimtalk_balance = alimtalk_balance + v_cost
     WHERE id = p_user_id
    RETURNING alimtalk_balance INTO v_balance;

    RETURN QUERY SELECT true, v_balance, true, NULL::text;
    RETURN;
  END IF;

  INSERT INTO alimtalk_transactions
    (user_id, type, credits_change, balance_after, event_id, memo)
  VALUES
    (p_user_id, 'adjust', -v_cost, v_balance, p_event_id, 'guestbook_event_unlock');

  RETURN QUERY SELECT true, v_balance, false, NULL::text;
END;
$$;


ALTER TABLE guestbook_event_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS guestbook_event_unlocks_select_all ON guestbook_event_unlocks;
CREATE POLICY guestbook_event_unlocks_select_all ON guestbook_event_unlocks
  FOR SELECT USING (true);

GRANT EXECUTE ON FUNCTION get_guestbook_event_access_state(uuid)
  TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION unlock_guestbook_event_access(uuid, uuid, integer)
  TO authenticated, anon, service_role;
