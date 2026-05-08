-- ============================================================================
-- 챙길 경조사 알림 출처 보정
-- ----------------------------------------------------------------------------
-- 웹 모바일 청첩장 방명록도 guest_book에 저장되므로, 전화번호만 보고 매칭하면
-- 방명록 작성자가 "챙길 경조사"에 잘못 노출된다.
-- 앞으로는 앱 하객 접수대에서 저장된 기록만 상호 경조사 알림의 근거로 사용한다.
-- ============================================================================

CREATE OR REPLACE FUNCTION is_reception_guest_book_entry(p_entry guest_book)
RETURNS boolean
LANGUAGE sql
STABLE AS $$
  SELECT
    COALESCE(p_entry.amount, 0) > 0
    AND normalize_korean_phone(p_entry.guest_phone) IS NOT NULL
    AND length(normalize_korean_phone(p_entry.guest_phone)) >= 10
    AND (
      p_entry.input_method = 'handwriting'
      OR p_entry.handwriting_image_url IS NOT NULL
      OR p_entry.additional_info->>'created_via' = 'app_guest_reception'
    )
$$;

CREATE OR REPLACE FUNCTION create_reciprocity_notifications_for_event(
  p_new_event_id uuid
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_event events%ROWTYPE;
  v_new_owner_phone text;
  v_inserted integer := 0;
BEGIN
  SELECT * INTO v_new_event
    FROM events
   WHERE id = p_new_event_id;

  IF v_new_event.id IS NULL OR v_new_event.user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT normalize_korean_phone(phone)
    INTO v_new_owner_phone
    FROM users
   WHERE id = v_new_event.user_id;

  IF v_new_owner_phone IS NULL OR length(v_new_owner_phone) < 10 THEN
    RETURN 0;
  END IF;

  INSERT INTO event_reciprocity_notifications (
    receiver_user_id,
    original_event_id,
    new_event_id,
    source_guest_id,
    source_guest_name,
    source_guest_phone,
    source_amount
  )
  SELECT DISTINCT ON (original_event.user_id, original_event.id)
    original_event.user_id,
    original_event.id,
    v_new_event.id,
    gb.id,
    gb.guest_name,
    gb.guest_phone,
    COALESCE(gb.amount, 0)
  FROM guest_book gb
  JOIN events original_event ON original_event.id = gb.event_id
  WHERE normalize_korean_phone(gb.guest_phone) = v_new_owner_phone
    AND is_reception_guest_book_entry(gb)
    AND original_event.user_id IS NOT NULL
    AND original_event.user_id <> v_new_event.user_id
  ORDER BY original_event.user_id, original_event.id, gb.created_at DESC
  ON CONFLICT (receiver_user_id, original_event_id, new_event_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;

CREATE OR REPLACE FUNCTION event_reciprocity_after_guest_book_phone_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_phone text;
  v_user record;
BEGIN
  IF NOT is_reception_guest_book_entry(NEW) THEN
    RETURN NEW;
  END IF;

  v_phone := normalize_korean_phone(NEW.guest_phone);

  IF v_phone IS NULL OR length(v_phone) < 10 THEN
    RETURN NEW;
  END IF;

  FOR v_user IN
    SELECT id
      FROM users
     WHERE normalize_korean_phone(phone) = v_phone
  LOOP
    PERFORM create_reciprocity_notifications_for_user(v_user.id);
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION debug_reciprocity_phone_matches(
  p_phone text
) RETURNS TABLE (
  normalized_phone text,
  matched_guest_id uuid,
  matched_guest_name text,
  matched_guest_phone text,
  original_event_id uuid,
  original_event_name text,
  original_owner_id uuid,
  new_event_id uuid,
  new_event_name text,
  new_owner_id uuid
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_phone text;
BEGIN
  v_phone := normalize_korean_phone(p_phone);

  RETURN QUERY
  SELECT
    v_phone::text,
    gb.id,
    gb.guest_name::text,
    gb.guest_phone::text,
    original_event.id,
    original_event.event_name::text,
    original_event.user_id,
    new_event.id,
    new_event.event_name::text,
    new_event.user_id
  FROM guest_book gb
  JOIN events original_event ON original_event.id = gb.event_id
  JOIN users new_owner ON normalize_korean_phone(new_owner.phone) = v_phone
  JOIN events new_event ON new_event.user_id = new_owner.id
  WHERE normalize_korean_phone(gb.guest_phone) = v_phone
    AND is_reception_guest_book_entry(gb)
    AND original_event.user_id IS NOT NULL
    AND original_event.user_id <> new_event.user_id
  ORDER BY gb.created_at DESC, new_event.created_at DESC;
END;
$$;

-- 이미 웹 방명록 때문에 만들어진 잘못된 알림 정리
DELETE FROM event_reciprocity_notifications ern
USING guest_book gb
WHERE ern.source_guest_id = gb.id
  AND NOT is_reception_guest_book_entry(gb);

-- 이미 만들어진 새 경조사 중 아직 알림이 생성되지 않은 건을 보정한다.
-- ON CONFLICT DO NOTHING이 적용되어 기존 정상 알림은 중복 생성되지 않는다.
SELECT backfill_reciprocity_notifications();

GRANT EXECUTE ON FUNCTION is_reception_guest_book_entry(guest_book)
  TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION create_reciprocity_notifications_for_event(uuid)
  TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION debug_reciprocity_phone_matches(text)
  TO authenticated, anon, service_role;
