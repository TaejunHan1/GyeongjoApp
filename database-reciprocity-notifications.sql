-- ============================================================================
-- 돌아온 경조사 알림 시스템
-- ----------------------------------------------------------------------------
-- - 내 행사에 부조/축의했던 하객이 나중에 정담에서 행사를 만들면 알림 생성
-- - guest_book.guest_phone 과 users.phone 을 숫자만 비교해서 매칭
-- - 알림 수신자는 원래 행사를 만든 사람(events.user_id)
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_korean_phone(p_phone text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  WITH normalized AS (
    SELECT regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g') AS digits
  )
  SELECT CASE
    -- +82 10-1234-5678 / 82-10-1234-5678 로 저장된 번호를 01012345678로 통일
    WHEN digits ~ '^82(10|11|16|17|18|19)[0-9]{7,8}$'
      THEN '0' || substring(digits from 3)
    -- 0082-10-1234-5678 케이스
    WHEN digits ~ '^0082(10|11|16|17|18|19)[0-9]{7,8}$'
      THEN '0' || substring(digits from 5)
    ELSE digits
  END
  FROM normalized
$$;

CREATE TABLE IF NOT EXISTS event_reciprocity_notifications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver_user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  new_event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  source_guest_id     uuid REFERENCES guest_book(id) ON DELETE SET NULL,
  source_guest_name   text,
  source_guest_phone  text,
  source_amount       integer DEFAULT 0,
  status              text NOT NULL DEFAULT 'unread'
                       CHECK (status IN ('unread', 'read', 'dismissed', 'completed')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (receiver_user_id, original_event_id, new_event_id)
);

COMMENT ON TABLE event_reciprocity_notifications IS '내 행사에 부조했던 사람이 새 경조사를 만들었을 때 주최자에게 보여주는 알림';

CREATE INDEX IF NOT EXISTS event_reciprocity_notifications_receiver_idx
  ON event_reciprocity_notifications (receiver_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS event_reciprocity_notifications_new_event_idx
  ON event_reciprocity_notifications (new_event_id);

ALTER TABLE event_reciprocity_notifications
  DROP CONSTRAINT IF EXISTS event_reciprocity_notifications_status_check;

ALTER TABLE event_reciprocity_notifications
  ADD CONSTRAINT event_reciprocity_notifications_status_check
  CHECK (status IN ('unread', 'read', 'dismissed', 'completed'));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1
         FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'event_reciprocity_notifications'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE event_reciprocity_notifications;
  END IF;
END;
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
    AND COALESCE(gb.amount, 0) > 0
    AND original_event.user_id IS NOT NULL
    AND original_event.user_id <> v_new_event.user_id
  ORDER BY original_event.user_id, original_event.id, gb.created_at DESC
  ON CONFLICT (receiver_user_id, original_event_id, new_event_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;


CREATE OR REPLACE FUNCTION event_reciprocity_after_event_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM create_reciprocity_notifications_for_event(NEW.id);
  RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION create_reciprocity_notifications_for_user(
  p_user_id uuid
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_event record;
  v_total integer := 0;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;

  FOR v_event IN
    SELECT id
      FROM events
     WHERE user_id = p_user_id
     ORDER BY created_at ASC
  LOOP
    v_total := v_total + create_reciprocity_notifications_for_event(v_event.id);
  END LOOP;

  RETURN v_total;
END;
$$;


CREATE OR REPLACE FUNCTION event_reciprocity_after_user_phone_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR normalize_korean_phone(OLD.phone) IS DISTINCT FROM normalize_korean_phone(NEW.phone) THEN
    PERFORM create_reciprocity_notifications_for_user(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION event_reciprocity_after_guest_book_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_phone text;
  v_user record;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM event_reciprocity_notifications
     WHERE source_guest_id = OLD.id;
    RETURN OLD;
  END IF;

  IF COALESCE(NEW.amount, 0) <= 0 THEN
    DELETE FROM event_reciprocity_notifications
     WHERE source_guest_id = NEW.id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND normalize_korean_phone(OLD.guest_phone) IS DISTINCT FROM normalize_korean_phone(NEW.guest_phone) THEN
    DELETE FROM event_reciprocity_notifications
     WHERE source_guest_id = NEW.id;
  END IF;

  UPDATE event_reciprocity_notifications
     SET source_guest_name = NEW.guest_name,
         source_guest_phone = NEW.guest_phone,
         source_amount = COALESCE(NEW.amount, 0),
         updated_at = now()
   WHERE source_guest_id = NEW.id;

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

DROP TRIGGER IF EXISTS trg_event_reciprocity_after_event_insert ON events;
CREATE TRIGGER trg_event_reciprocity_after_event_insert
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION event_reciprocity_after_event_insert();

DROP TRIGGER IF EXISTS trg_event_reciprocity_after_user_phone_change ON users;
CREATE TRIGGER trg_event_reciprocity_after_user_phone_change
  AFTER INSERT OR UPDATE OF phone ON users
  FOR EACH ROW
  EXECUTE FUNCTION event_reciprocity_after_user_phone_change();

DROP TRIGGER IF EXISTS trg_event_reciprocity_after_guest_book_phone_change ON guest_book;
CREATE TRIGGER trg_event_reciprocity_after_guest_book_phone_change
  AFTER INSERT OR UPDATE OF guest_phone, guest_name, amount ON guest_book
  FOR EACH ROW
  EXECUTE FUNCTION event_reciprocity_after_guest_book_change();

DROP TRIGGER IF EXISTS trg_event_reciprocity_after_guest_book_delete ON guest_book;
CREATE TRIGGER trg_event_reciprocity_after_guest_book_delete
  BEFORE DELETE ON guest_book
  FOR EACH ROW
  EXECUTE FUNCTION event_reciprocity_after_guest_book_change();

DELETE FROM event_reciprocity_notifications ern
 WHERE ern.source_guest_id IS NULL
    OR NOT EXISTS (
      SELECT 1
        FROM guest_book gb
       WHERE gb.id = ern.source_guest_id
         AND COALESCE(gb.amount, 0) > 0
    );


CREATE OR REPLACE FUNCTION update_reciprocity_notification_status(
  p_user_id uuid,
  p_notification_id uuid,
  p_status text DEFAULT 'read'
) RETURNS TABLE (
  success boolean,
  error text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_status NOT IN ('unread', 'read', 'dismissed', 'completed') THEN
    RETURN QUERY SELECT false, 'invalid_status'::text;
    RETURN;
  END IF;

  UPDATE event_reciprocity_notifications
     SET status = p_status,
         updated_at = now()
   WHERE id = p_notification_id
     AND receiver_user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'not_found'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, NULL::text;
END;
$$;


CREATE OR REPLACE FUNCTION backfill_reciprocity_notifications()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_event record;
  v_total integer := 0;
BEGIN
  FOR v_event IN
    SELECT id FROM events ORDER BY created_at ASC
  LOOP
    v_total := v_total + create_reciprocity_notifications_for_event(v_event.id);
  END LOOP;

  RETURN v_total;
END;
$$;


-- 특정 휴대폰번호가 어떤 하객/새 행사와 매칭되는지 점검용
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
    AND original_event.user_id IS NOT NULL
    AND original_event.user_id <> new_event.user_id
  ORDER BY gb.created_at DESC, new_event.created_at DESC;
END;
$$;


ALTER TABLE event_reciprocity_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_reciprocity_notifications_select_all ON event_reciprocity_notifications;
CREATE POLICY event_reciprocity_notifications_select_all ON event_reciprocity_notifications
  FOR SELECT USING (true);

GRANT EXECUTE ON FUNCTION create_reciprocity_notifications_for_event(uuid)
  TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION create_reciprocity_notifications_for_user(uuid)
  TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION update_reciprocity_notification_status(uuid, uuid, text)
  TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION backfill_reciprocity_notifications()
  TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION debug_reciprocity_phone_matches(text)
  TO authenticated, anon, service_role;
