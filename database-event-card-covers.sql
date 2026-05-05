-- ============================================================================
-- 주최 경조사 카드 덮개 구매 시스템
-- ----------------------------------------------------------------------------
-- - users.alimtalk_balance 공용 크레딧 지갑 사용
-- - 덮개는 계정 단위로 1회 구매하면 계속 보유
-- - 행사별 적용값은 events.additional_info.card_cover_key에 저장
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_card_cover_purchases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cover_key     text NOT NULL,
  price_credits integer NOT NULL DEFAULT 0,
  purchased_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, cover_key)
);

COMMENT ON TABLE event_card_cover_purchases IS '주최 경조사 카드 덮개 구매 내역';

CREATE INDEX IF NOT EXISTS event_card_cover_purchases_user_idx
  ON event_card_cover_purchases (user_id, purchased_at DESC);


CREATE OR REPLACE FUNCTION purchase_event_card_cover(
  p_user_id       uuid,
  p_cover_key     text,
  p_price_credits integer DEFAULT 0
) RETURNS TABLE (
  success       boolean,
  new_balance   integer,
  already_owned boolean,
  error         text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance integer;
  v_cost    integer;
  v_owned   boolean;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN QUERY SELECT false, 0, false, 'missing_user_id'::text;
    RETURN;
  END IF;

  IF p_cover_key IS NULL OR length(trim(p_cover_key)) = 0 THEN
    RETURN QUERY SELECT false, 0, false, 'missing_cover_key'::text;
    RETURN;
  END IF;

  v_cost := GREATEST(COALESCE(p_price_credits, 0), 0);

  SELECT EXISTS (
    SELECT 1
      FROM event_card_cover_purchases
     WHERE user_id = p_user_id
       AND cover_key = p_cover_key
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

  INSERT INTO event_card_cover_purchases
    (user_id, cover_key, price_credits)
  VALUES
    (p_user_id, p_cover_key, v_cost)
  ON CONFLICT (user_id, cover_key) DO NOTHING;

  -- 동시에 구매 요청이 들어온 경우 차감분 환불
  IF NOT FOUND THEN
    UPDATE users
       SET alimtalk_balance = alimtalk_balance + v_cost
     WHERE id = p_user_id
    RETURNING alimtalk_balance INTO v_balance;

    RETURN QUERY SELECT true, v_balance, true, NULL::text;
    RETURN;
  END IF;

  INSERT INTO alimtalk_transactions
    (user_id, type, credits_change, balance_after, memo)
  VALUES
    (p_user_id, 'adjust', -v_cost, v_balance, 'event_card_cover:' || p_cover_key);

  RETURN QUERY SELECT true, v_balance, false, NULL::text;
END;
$$;


ALTER TABLE event_card_cover_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_card_cover_purchases_select_all ON event_card_cover_purchases;
CREATE POLICY event_card_cover_purchases_select_all ON event_card_cover_purchases
  FOR SELECT USING (true);

GRANT EXECUTE ON FUNCTION purchase_event_card_cover(uuid, text, integer)
  TO authenticated, anon, service_role;
