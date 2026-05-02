-- ============================================================================
-- 하객 접수 종이 배경 템플릿 구매 시스템
-- ----------------------------------------------------------------------------
-- - users.alimtalk_balance를 공통 크레딧 지갑으로 사용
-- - 구매한 배경은 사용자 단위로 영구 보유
-- - 차감은 RPC 안에서 원자적으로 처리
-- ============================================================================

CREATE TABLE IF NOT EXISTS guestbook_paper_purchases (
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id   text NOT NULL,
  price_credits integer NOT NULL DEFAULT 0,
  event_id      uuid REFERENCES events(id) ON DELETE SET NULL,
  purchased_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, template_id)
);

COMMENT ON TABLE guestbook_paper_purchases IS '하객 접수 종이 배경 템플릿 구매 내역';

CREATE INDEX IF NOT EXISTS guestbook_paper_purchases_user_idx
  ON guestbook_paper_purchases (user_id, purchased_at DESC);


CREATE TABLE IF NOT EXISTS guestbook_paper_transactions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id    text NOT NULL,
  credits_change integer NOT NULL,
  balance_after  integer NOT NULL,
  event_id       uuid REFERENCES events(id) ON DELETE SET NULL,
  memo           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE guestbook_paper_transactions IS '하객 접수 종이 배경 구매 크레딧 거래 내역';

CREATE INDEX IF NOT EXISTS guestbook_paper_tx_user_created_idx
  ON guestbook_paper_transactions (user_id, created_at DESC);


CREATE OR REPLACE FUNCTION purchase_guestbook_paper_template(
  p_user_id       uuid,
  p_template_id   text,
  p_price_credits integer,
  p_event_id      uuid DEFAULT NULL
) RETURNS TABLE (
  success       boolean,
  new_balance   integer,
  already_owned boolean,
  error         text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance integer;
  v_owned   boolean;
BEGIN
  IF p_template_id IS NULL OR length(trim(p_template_id)) = 0 THEN
    RETURN QUERY SELECT false, 0, false, 'missing_template_id'::text;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM guestbook_paper_purchases
     WHERE user_id = p_user_id AND template_id = p_template_id
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

  IF COALESCE(p_price_credits, 0) <= 0 THEN
    INSERT INTO guestbook_paper_purchases
      (user_id, template_id, price_credits, event_id)
    VALUES
      (p_user_id, p_template_id, 0, p_event_id)
    ON CONFLICT (user_id, template_id) DO NOTHING;

    RETURN QUERY SELECT true, v_balance, false, NULL::text;
    RETURN;
  END IF;

  UPDATE users
     SET alimtalk_balance = alimtalk_balance - p_price_credits
   WHERE id = p_user_id
     AND alimtalk_balance >= p_price_credits
  RETURNING alimtalk_balance INTO v_balance;

  IF v_balance IS NULL THEN
    SELECT alimtalk_balance INTO v_balance FROM users WHERE id = p_user_id;
    RETURN QUERY SELECT false, COALESCE(v_balance, 0), false, 'insufficient_balance'::text;
    RETURN;
  END IF;

  INSERT INTO guestbook_paper_purchases
    (user_id, template_id, price_credits, event_id)
  VALUES
    (p_user_id, p_template_id, p_price_credits, p_event_id)
  ON CONFLICT (user_id, template_id) DO NOTHING;

  INSERT INTO guestbook_paper_transactions
    (user_id, template_id, credits_change, balance_after, event_id, memo)
  VALUES
    (p_user_id, p_template_id, -p_price_credits, v_balance, p_event_id, 'guestbook_paper_purchase');

  RETURN QUERY SELECT true, v_balance, false, NULL::text;
END;
$$;


ALTER TABLE guestbook_paper_purchases    ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_paper_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS guestbook_paper_purchases_select_own ON guestbook_paper_purchases;
CREATE POLICY guestbook_paper_purchases_select_own ON guestbook_paper_purchases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS guestbook_paper_tx_select_own ON guestbook_paper_transactions;
CREATE POLICY guestbook_paper_tx_select_own ON guestbook_paper_transactions
  FOR SELECT USING (auth.uid() = user_id);
