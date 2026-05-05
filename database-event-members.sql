-- ============================================================================
-- 행사 공유 멤버 시스템
-- ----------------------------------------------------------------------------
-- - 행사 소유자가 신부/부모님/축의대 담당자 등을 휴대폰번호로 초대
-- - 공유 멤버는 본인 휴대폰번호로 로그인하면 같은 행사를 볼 수 있음
-- - 크레딧은 users.alimtalk_balance 기준으로 각 계정별 분리
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_members (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id          uuid REFERENCES users(id) ON DELETE SET NULL,
  phone            text NOT NULL,
  phone_normalized text NOT NULL,
  display_name     text,
  role             text NOT NULL DEFAULT 'manager'
                    CHECK (role IN ('manager', 'viewer', 'reception')),
  status           text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'disabled')),
  invited_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, phone_normalized)
);

COMMENT ON TABLE event_members IS '행사 공유 멤버. 휴대폰번호 기준으로 행사 접근 권한을 부여한다.';
COMMENT ON COLUMN event_members.role IS 'manager=관리 가능, viewer=보기 전용, reception=축의대 접수 전용';

CREATE INDEX IF NOT EXISTS event_members_event_idx
  ON event_members (event_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS event_members_user_idx
  ON event_members (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS event_members_phone_idx
  ON event_members (phone_normalized, status, created_at DESC);


CREATE OR REPLACE FUNCTION normalize_korean_phone(p_phone text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g')
$$;


CREATE OR REPLACE FUNCTION event_member_can_manage(
  p_user_id uuid,
  p_event_id uuid
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_phone text;
  v_can_manage boolean;
BEGIN
  SELECT normalize_korean_phone(phone) INTO v_phone
    FROM users
   WHERE id = p_user_id;

  SELECT EXISTS (
    SELECT 1
      FROM events e
     WHERE e.id = p_event_id
       AND e.user_id = p_user_id
  )
  OR EXISTS (
    SELECT 1
      FROM event_members em
     WHERE em.event_id = p_event_id
       AND em.status = 'active'
       AND em.role IN ('manager', 'reception')
       AND (
         em.user_id = p_user_id
         OR (v_phone IS NOT NULL AND em.phone_normalized = v_phone)
       )
  ) INTO v_can_manage;

  RETURN COALESCE(v_can_manage, false);
END;
$$;


CREATE OR REPLACE FUNCTION upsert_event_member(
  p_inviter_id uuid,
  p_event_id uuid,
  p_phone text,
  p_display_name text DEFAULT NULL,
  p_role text DEFAULT 'manager'
) RETURNS TABLE (
  success boolean,
  member_id uuid,
  error text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_phone text;
  v_role text;
  v_member_id uuid;
  v_user_id uuid;
BEGIN
  v_phone := normalize_korean_phone(p_phone);
  v_role := COALESCE(NULLIF(p_role, ''), 'manager');

  IF p_event_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 'missing_event_id'::text;
    RETURN;
  END IF;

  IF length(v_phone) < 10 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'invalid_phone'::text;
    RETURN;
  END IF;

  IF v_role NOT IN ('manager', 'viewer', 'reception') THEN
    RETURN QUERY SELECT false, NULL::uuid, 'invalid_role'::text;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM events
     WHERE id = p_event_id
       AND user_id = p_inviter_id
  ) THEN
    RETURN QUERY SELECT false, NULL::uuid, 'permission_denied'::text;
    RETURN;
  END IF;

  SELECT id INTO v_user_id
    FROM users
   WHERE normalize_korean_phone(phone) = v_phone
   LIMIT 1;

  INSERT INTO event_members
    (event_id, user_id, phone, phone_normalized, display_name, role, status, invited_by)
  VALUES
    (p_event_id, v_user_id, p_phone, v_phone, NULLIF(trim(COALESCE(p_display_name, '')), ''), v_role, 'active', p_inviter_id)
  ON CONFLICT (event_id, phone_normalized)
  DO UPDATE SET
    user_id = COALESCE(EXCLUDED.user_id, event_members.user_id),
    phone = EXCLUDED.phone,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    status = 'active',
    invited_by = EXCLUDED.invited_by,
    updated_at = now()
  RETURNING id INTO v_member_id;

  RETURN QUERY SELECT true, v_member_id, NULL::text;
END;
$$;


CREATE OR REPLACE FUNCTION disable_event_member(
  p_actor_id uuid,
  p_member_id uuid
) RETURNS TABLE (
  success boolean,
  error text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_event_id uuid;
BEGIN
  SELECT event_id INTO v_event_id
    FROM event_members
   WHERE id = p_member_id;

  IF v_event_id IS NULL THEN
    RETURN QUERY SELECT false, 'not_found'::text;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM events WHERE id = v_event_id AND user_id = p_actor_id
  ) THEN
    RETURN QUERY SELECT false, 'permission_denied'::text;
    RETURN;
  END IF;

  UPDATE event_members
     SET status = 'disabled',
         updated_at = now()
   WHERE id = p_member_id;

  RETURN QUERY SELECT true, NULL::text;
END;
$$;


CREATE OR REPLACE FUNCTION update_shared_event_additional_info(
  p_actor_id uuid,
  p_event_id uuid,
  p_additional_info jsonb
) RETURNS TABLE (
  success boolean,
  error text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT event_member_can_manage(p_actor_id, p_event_id) THEN
    RETURN QUERY SELECT false, 'permission_denied'::text;
    RETURN;
  END IF;

  UPDATE events
     SET additional_info = COALESCE(p_additional_info, '{}'::jsonb),
         updated_at = now()
   WHERE id = p_event_id;

  RETURN QUERY SELECT true, NULL::text;
END;
$$;


ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_members_select_all ON event_members;
CREATE POLICY event_members_select_all ON event_members
  FOR SELECT USING (true);

GRANT EXECUTE ON FUNCTION normalize_korean_phone(text)
  TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION event_member_can_manage(uuid, uuid)
  TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION upsert_event_member(uuid, uuid, text, text, text)
  TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION disable_event_member(uuid, uuid)
  TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION update_shared_event_additional_info(uuid, uuid, jsonb)
  TO authenticated, anon, service_role;
