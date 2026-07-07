-- ============================================================================
-- 정담 / GyeongjoApp 관리자 콘솔
-- ----------------------------------------------------------------------------
-- 관리자 번호: 01058359358
-- 기능:
--   1) 앱 공지 모달 생성/수정/삭제 및 화면별 노출
--   2) 사용자별 크레딧 조회/수동 조정
--   3) 사용자별 행사, 축의금/부조금 상세 조회
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS alimtalk_balance integer NOT NULL DEFAULT 0;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_alimtalk_balance_nonneg;

ALTER TABLE users
  ADD CONSTRAINT users_alimtalk_balance_nonneg
  CHECK (alimtalk_balance >= 0);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION admin_normalize_phone(p_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  WITH normalized AS (
    SELECT regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g') AS digits
  )
  SELECT CASE
    WHEN digits LIKE '0082%' THEN '0' || substr(digits, 5)
    WHEN digits LIKE '82%' THEN '0' || substr(digits, 3)
    ELSE digits
  END
  FROM normalized;
$$;

CREATE OR REPLACE FUNCTION is_cashlog_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM users u
     WHERE u.id = p_user_id
       AND admin_normalize_phone(u.phone) = '01058359358'
  );
$$;

CREATE TABLE IF NOT EXISTS admin_app_modals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  body          text,
  image_url     text,
  target_screen text NOT NULL DEFAULT 'all'
    CHECK (target_screen IN ('all', 'home', 'my_events', 'guide', 'studio', 'profile')),
  starts_at     timestamptz,
  ends_at       timestamptz,
  cta_label     text,
  cta_url       text,
  priority      integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_app_modals_active_target
  ON admin_app_modals (is_active, target_screen, priority DESC, created_at DESC);

DROP TRIGGER IF EXISTS update_admin_app_modals_updated_at ON admin_app_modals;
CREATE TRIGGER update_admin_app_modals_updated_at
BEFORE UPDATE ON admin_app_modals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS admin_app_modal_dismissals (
  modal_id          uuid NOT NULL REFERENCES admin_app_modals(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dismissed_forever boolean NOT NULL DEFAULT false,
  dismissed_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (modal_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_app_modal_dismissals_user
  ON admin_app_modal_dismissals (user_id, dismissed_at DESC);

CREATE TABLE IF NOT EXISTS alimtalk_transactions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type             text NOT NULL CHECK (type IN ('charge', 'send', 'refund', 'adjust')),
  credits_change   integer NOT NULL,
  balance_after    integer NOT NULL,
  event_id         uuid REFERENCES events(id) ON DELETE SET NULL,
  contribution_id  uuid,
  package_id       text,
  payment_platform text CHECK (payment_platform IN ('apple', 'google', 'manual')),
  payment_receipt  text,
  payment_tx_id    text,
  memo             text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS alimtalk_tx_user_created_idx
  ON alimtalk_transactions (user_id, created_at DESC);

ALTER TABLE admin_app_modals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_app_modal_dismissals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_app_modals_active_select ON admin_app_modals;
CREATE POLICY admin_app_modals_active_select
ON admin_app_modals
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS admin_app_modal_dismissals_select ON admin_app_modal_dismissals;
CREATE POLICY admin_app_modal_dismissals_select
ON admin_app_modal_dismissals
FOR SELECT
USING (true);

DROP POLICY IF EXISTS admin_app_modal_dismissals_insert ON admin_app_modal_dismissals;
CREATE POLICY admin_app_modal_dismissals_insert
ON admin_app_modal_dismissals
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS admin_app_modal_dismissals_update ON admin_app_modal_dismissals;
CREATE POLICY admin_app_modal_dismissals_update
ON admin_app_modal_dismissals
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION assert_cashlog_admin(p_admin_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_admin_user_id IS NULL OR NOT is_cashlog_admin(p_admin_user_id) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION admin_get_dashboard(p_admin_user_id uuid)
RETURNS TABLE (
  total_users bigint,
  total_events bigint,
  total_contribution_count bigint,
  total_contribution_amount bigint,
  total_credit_balance bigint,
  active_modal_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM assert_cashlog_admin(p_admin_user_id);

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM users)::bigint AS total_users,
    (SELECT COUNT(*) FROM events)::bigint AS total_events,
    (SELECT COUNT(*) FROM guest_book WHERE amount IS NOT NULL)::bigint AS total_contribution_count,
    (SELECT COALESCE(SUM(amount), 0)::bigint FROM guest_book)::bigint AS total_contribution_amount,
    (SELECT COALESCE(SUM(alimtalk_balance), 0)::bigint FROM users)::bigint AS total_credit_balance,
    (SELECT COUNT(*) FROM admin_app_modals WHERE is_active = true)::bigint AS active_modal_count;
END;
$$;

CREATE OR REPLACE FUNCTION admin_get_modals(p_admin_user_id uuid)
RETURNS SETOF admin_app_modals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM assert_cashlog_admin(p_admin_user_id);

  RETURN QUERY
  SELECT *
    FROM admin_app_modals
   ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_save_modal(
  p_admin_user_id uuid,
  p_modal_id uuid,
  p_title text,
  p_body text,
  p_image_url text,
  p_target_screen text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_cta_label text,
  p_cta_url text,
  p_priority integer,
  p_is_active boolean
)
RETURNS SETOF admin_app_modals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM assert_cashlog_admin(p_admin_user_id);

  IF NULLIF(trim(COALESCE(p_title, '')), '') IS NULL THEN
    RAISE EXCEPTION 'title_required';
  END IF;

  IF p_modal_id IS NULL THEN
    RETURN QUERY
    INSERT INTO admin_app_modals (
      title,
      body,
      image_url,
      target_screen,
      starts_at,
      ends_at,
      cta_label,
      cta_url,
      priority,
      is_active,
      created_by
    )
    VALUES (
      trim(p_title),
      NULLIF(trim(COALESCE(p_body, '')), ''),
      NULLIF(trim(COALESCE(p_image_url, '')), ''),
      COALESCE(NULLIF(p_target_screen, ''), 'all'),
      p_starts_at,
      p_ends_at,
      NULLIF(trim(COALESCE(p_cta_label, '')), ''),
      NULLIF(trim(COALESCE(p_cta_url, '')), ''),
      COALESCE(p_priority, 0),
      COALESCE(p_is_active, true),
      p_admin_user_id
    )
    RETURNING *;
  ELSE
    RETURN QUERY
    UPDATE admin_app_modals
       SET title = trim(p_title),
           body = NULLIF(trim(COALESCE(p_body, '')), ''),
           image_url = NULLIF(trim(COALESCE(p_image_url, '')), ''),
           target_screen = COALESCE(NULLIF(p_target_screen, ''), 'all'),
           starts_at = p_starts_at,
           ends_at = p_ends_at,
           cta_label = NULLIF(trim(COALESCE(p_cta_label, '')), ''),
           cta_url = NULLIF(trim(COALESCE(p_cta_url, '')), ''),
           priority = COALESCE(p_priority, 0),
           is_active = COALESCE(p_is_active, true)
     WHERE id = p_modal_id
    RETURNING *;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_modal(
  p_admin_user_id uuid,
  p_modal_id uuid
)
RETURNS TABLE (
  success boolean,
  error text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM assert_cashlog_admin(p_admin_user_id);

  DELETE FROM admin_app_modals
   WHERE id = p_modal_id;

  RETURN QUERY SELECT true, NULL::text;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, SQLERRM::text;
END;
$$;

CREATE OR REPLACE FUNCTION admin_get_users(p_admin_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  alimtalk_balance integer,
  total_events bigint,
  total_contribution_count bigint,
  total_contribution_amount bigint,
  created_at timestamptz,
  last_event_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM assert_cashlog_admin(p_admin_user_id);

  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.phone,
    COALESCE(u.alimtalk_balance, 0) AS alimtalk_balance,
    COUNT(DISTINCT e.id)::bigint AS total_events,
    COUNT(gb.id)::bigint AS total_contribution_count,
    COALESCE(SUM(gb.amount), 0)::bigint AS total_contribution_amount,
    u.created_at,
    MAX(e.created_at) AS last_event_at
  FROM users u
  LEFT JOIN events e ON e.user_id = u.id
  LEFT JOIN guest_book gb ON gb.event_id = e.id
  GROUP BY u.id, u.name, u.phone, u.alimtalk_balance, u.created_at
  ORDER BY u.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_get_user_events(
  p_admin_user_id uuid,
  p_target_user_id uuid
)
RETURNS TABLE (
  event_id uuid,
  event_name text,
  event_type text,
  event_date timestamptz,
  status text,
  created_at timestamptz,
  contribution_count bigint,
  contribution_amount bigint,
  latest_guest_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM assert_cashlog_admin(p_admin_user_id);

  RETURN QUERY
  SELECT
    e.id AS event_id,
    e.event_name,
    e.event_type,
    e.event_date::timestamptz AS event_date,
    e.status,
    e.created_at,
    COUNT(gb.id)::bigint AS contribution_count,
    COALESCE(SUM(gb.amount), 0)::bigint AS contribution_amount,
    MAX(gb.created_at) AS latest_guest_at
  FROM events e
  LEFT JOIN guest_book gb ON gb.event_id = e.id
  WHERE e.user_id = p_target_user_id
  GROUP BY e.id, e.event_name, e.event_type, e.event_date, e.status, e.created_at
  ORDER BY e.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_get_event_guests(
  p_admin_user_id uuid,
  p_event_id uuid
)
RETURNS TABLE (
  guest_id uuid,
  guest_name text,
  guest_phone text,
  amount integer,
  amount_type text,
  payment_method text,
  input_method text,
  relation_category text,
  relation_detail text,
  message text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM assert_cashlog_admin(p_admin_user_id);

  RETURN QUERY
  SELECT
    gb.id AS guest_id,
    gb.guest_name,
    gb.guest_phone,
    gb.amount,
    gb.amount_type,
    gb.payment_method,
    gb.input_method,
    gb.relation_category,
    gb.relation_detail,
    gb.message,
    gb.created_at
  FROM guest_book gb
  WHERE gb.event_id = p_event_id
  ORDER BY gb.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_adjust_user_credits(
  p_admin_user_id uuid,
  p_target_user_id uuid,
  p_delta integer,
  p_memo text DEFAULT NULL
)
RETURNS TABLE (
  success boolean,
  new_balance integer,
  applied_delta integer,
  error text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before integer;
  v_after integer;
  v_applied integer;
BEGIN
  PERFORM assert_cashlog_admin(p_admin_user_id);

  IF p_delta IS NULL OR p_delta = 0 THEN
    RETURN QUERY SELECT false, NULL::integer, 0::integer, 'invalid_delta'::text;
    RETURN;
  END IF;

  SELECT COALESCE(alimtalk_balance, 0)
    INTO v_before
    FROM users
   WHERE id = p_target_user_id
   FOR UPDATE;

  IF v_before IS NULL THEN
    RETURN QUERY SELECT false, NULL::integer, 0::integer, 'user_not_found'::text;
    RETURN;
  END IF;

  v_after := GREATEST(0, v_before + p_delta);
  v_applied := v_after - v_before;

  UPDATE users
     SET alimtalk_balance = v_after,
         updated_at = now()
   WHERE id = p_target_user_id;

  INSERT INTO alimtalk_transactions (
    user_id,
    type,
    credits_change,
    balance_after,
    payment_platform,
    memo
  )
  VALUES (
    p_target_user_id,
    'adjust',
    v_applied,
    v_after,
    'manual',
    COALESCE(NULLIF(trim(p_memo), ''), 'admin_manual_adjust')
  );

  RETURN QUERY SELECT true, v_after, v_applied, NULL::text;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::integer, 0::integer, SQLERRM::text;
END;
$$;

GRANT SELECT ON admin_app_modals TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON admin_app_modal_dismissals TO anon, authenticated;

GRANT EXECUTE ON FUNCTION admin_normalize_phone(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_cashlog_admin(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_dashboard(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_modals(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_save_modal(uuid, uuid, text, text, text, text, timestamptz, timestamptz, text, text, integer, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_modal(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_users(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_user_events(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_event_guests(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_adjust_user_credits(uuid, uuid, integer, text) TO anon, authenticated;
