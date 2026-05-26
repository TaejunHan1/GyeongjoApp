-- Event message moderation
-- App Store review item 6: hosts can delete user-generated guestbook messages.

CREATE OR REPLACE FUNCTION delete_event_message_for_owner(
  p_message_id uuid,
  p_actor_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_owner_id uuid;
  v_can_manage boolean := false;
BEGIN
  IF p_message_id IS NULL OR p_actor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'missing_required_fields');
  END IF;

  SELECT em.event_id, e.user_id
    INTO v_event_id, v_owner_id
  FROM event_messages em
  JOIN events e ON e.id = em.event_id
  WHERE em.id = p_message_id;

  IF v_event_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'message_not_found');
  END IF;

  v_can_manage := v_owner_id = p_actor_id
    OR EXISTS (
      SELECT 1
      FROM event_members m
      WHERE m.event_id = v_event_id
        AND m.status = 'active'
        AND m.user_id = p_actor_id
        AND m.role IN ('manager', 'reception')
    );

  IF NOT v_can_manage THEN
    RETURN jsonb_build_object('success', false, 'error', 'permission_denied');
  END IF;

  DELETE FROM event_messages
  WHERE id = p_message_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION delete_event_message_for_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_event_message_for_owner(uuid, uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION delete_guest_book_entry_for_owner(
  p_entry_id uuid,
  p_actor_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_owner_id uuid;
  v_can_manage boolean := false;
BEGIN
  IF p_entry_id IS NULL OR p_actor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'missing_required_fields');
  END IF;

  SELECT gb.event_id, e.user_id
    INTO v_event_id, v_owner_id
  FROM guest_book gb
  JOIN events e ON e.id = gb.event_id
  WHERE gb.id = p_entry_id;

  IF v_event_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'entry_not_found');
  END IF;

  v_can_manage := v_owner_id = p_actor_id
    OR EXISTS (
      SELECT 1
      FROM event_members m
      WHERE m.event_id = v_event_id
        AND m.status = 'active'
        AND m.user_id = p_actor_id
        AND m.role IN ('manager', 'reception')
    );

  IF NOT v_can_manage THEN
    RETURN jsonb_build_object('success', false, 'error', 'permission_denied');
  END IF;

  DELETE FROM guest_book
  WHERE id = p_entry_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION delete_guest_book_entry_for_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_guest_book_entry_for_owner(uuid, uuid) TO anon, authenticated, service_role;
