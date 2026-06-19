-- ============================================================================
-- 정담 앱 활동 알림/활동 로그
-- ----------------------------------------------------------------------------
-- 홈 알림함에 보여줄 사용자별 활동 기록을 저장한다.
-- 앱에서 직접 기록하는 액션과 DB에서 확실히 감지 가능한 액션을 모두 수용한다.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_activity_notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         text NOT NULL,
  category     text NOT NULL DEFAULT 'activity',
  title        text NOT NULL,
  body         text,
  event_id     uuid REFERENCES events(id) ON DELETE SET NULL,
  entity_type  text,
  entity_id    uuid,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  status       text NOT NULL DEFAULT 'unread'
               CHECK (status IN ('unread', 'read', 'dismissed')),
  dedupe_key   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  read_at      timestamptz
);

COMMENT ON TABLE user_activity_notifications IS '홈 알림함에 표시할 사용자별 앱 활동 기록';

CREATE INDEX IF NOT EXISTS user_activity_notifications_user_created_idx
  ON user_activity_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_activity_notifications_user_status_idx
  ON user_activity_notifications (user_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS user_activity_notifications_dedupe_idx
  ON user_activity_notifications (user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

ALTER TABLE user_activity_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_activity_notifications_select_own
  ON user_activity_notifications;
CREATE POLICY user_activity_notifications_select_own
  ON user_activity_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_activity_notifications_update_own
  ON user_activity_notifications;
CREATE POLICY user_activity_notifications_update_own
  ON user_activity_notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


CREATE OR REPLACE FUNCTION create_user_activity_notification(
  p_user_id     uuid,
  p_type        text,
  p_category    text DEFAULT 'activity',
  p_title       text DEFAULT NULL,
  p_body        text DEFAULT NULL,
  p_event_id    uuid DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_id   uuid DEFAULT NULL,
  p_metadata    jsonb DEFAULT '{}'::jsonb,
  p_dedupe_key  text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_user_id IS NULL OR p_type IS NULL OR p_title IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO user_activity_notifications (
    user_id,
    type,
    category,
    title,
    body,
    event_id,
    entity_type,
    entity_id,
    metadata,
    dedupe_key
  )
  VALUES (
    p_user_id,
    p_type,
    COALESCE(NULLIF(p_category, ''), 'activity'),
    p_title,
    p_body,
    p_event_id,
    p_entity_type,
    p_entity_id,
    COALESCE(p_metadata, '{}'::jsonb),
    p_dedupe_key
  )
  ON CONFLICT (user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL
  DO UPDATE SET
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    metadata = EXCLUDED.metadata,
    status = 'unread',
    created_at = now(),
    read_at = NULL
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_user_activity_notification(
  uuid, text, text, text, text, uuid, text, uuid, jsonb, text
) TO authenticated, anon, service_role;


CREATE OR REPLACE FUNCTION get_user_activity_notifications(
  p_user_id uuid,
  p_limit integer DEFAULT 300
) RETURNS TABLE (
  id uuid,
  user_id uuid,
  type text,
  category text,
  title text,
  body text,
  event_id uuid,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  status text,
  created_at timestamptz,
  read_at timestamptz
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    n.id,
    n.user_id,
    n.type,
    n.category,
    n.title,
    n.body,
    n.event_id,
    n.entity_type,
    n.entity_id,
    n.metadata,
    n.status,
    n.created_at,
    n.read_at
  FROM user_activity_notifications n
  WHERE n.user_id = p_user_id
    AND n.status <> 'dismissed'
  ORDER BY n.created_at DESC
  LIMIT GREATEST(COALESCE(p_limit, 300), 1);
$$;


CREATE OR REPLACE FUNCTION update_user_activity_notification_status(
  p_user_id uuid,
  p_notification_id uuid,
  p_status text DEFAULT 'read'
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_status NOT IN ('unread', 'read', 'dismissed') THEN
    RETURN false;
  END IF;

  UPDATE user_activity_notifications
     SET status = p_status,
         read_at = CASE WHEN p_status = 'read' THEN now() ELSE NULL END
   WHERE id = p_notification_id
     AND user_id = p_user_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_activity_notifications(uuid, integer)
  TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION update_user_activity_notification_status(uuid, uuid, text)
  TO authenticated, anon, service_role;


CREATE OR REPLACE FUNCTION event_type_label(p_event_type text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_event_type = 'funeral' THEN '부고장'
    WHEN p_event_type = 'wedding' THEN '청첩장'
    ELSE '경조사'
  END
$$;


CREATE OR REPLACE FUNCTION activity_after_event_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM create_user_activity_notification(
    NEW.user_id,
    'event_created',
    'event',
    event_type_label(NEW.event_type) || '을 만들었어요',
    COALESCE(NULLIF(NEW.event_name, ''), event_type_label(NEW.event_type)),
    NEW.id,
    'event',
    NEW.id,
    jsonb_build_object('event_type', NEW.event_type),
    'event_created:' || NEW.id::text
  );

  RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION activity_after_event_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_label text;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_label := event_type_label(NEW.event_type);

  IF COALESCE(OLD.is_finalized, false) IS DISTINCT FROM COALESCE(NEW.is_finalized, false)
     AND COALESCE(NEW.is_finalized, false) = true THEN
    PERFORM create_user_activity_notification(
      NEW.user_id,
      'event_finalized',
      'event',
      v_label || '을 확정했어요',
      COALESCE(NULLIF(NEW.event_name, ''), v_label),
      NEW.id,
      'event',
      NEW.id,
      jsonb_build_object('event_type', NEW.event_type),
      'event_finalized:' || NEW.id::text
    );
    RETURN NEW;
  END IF;

  IF OLD.event_name IS DISTINCT FROM NEW.event_name
     OR OLD.event_date IS DISTINCT FROM NEW.event_date
     OR OLD.location IS DISTINCT FROM NEW.location
     OR OLD.detailed_address IS DISTINCT FROM NEW.detailed_address
     OR OLD.template_style IS DISTINCT FROM NEW.template_style
     OR OLD.additional_info IS DISTINCT FROM NEW.additional_info THEN
    PERFORM create_user_activity_notification(
      NEW.user_id,
      'event_updated',
      'event',
      v_label || ' 정보를 수정했어요',
      COALESCE(NULLIF(NEW.event_name, ''), v_label),
      NEW.id,
      'event',
      NEW.id,
      jsonb_build_object('event_type', NEW.event_type),
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION activity_before_event_delete()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.user_id IS NULL THEN
    RETURN OLD;
  END IF;

  PERFORM create_user_activity_notification(
    OLD.user_id,
    'event_deleted',
    'event',
    event_type_label(OLD.event_type) || '을 삭제했어요',
    COALESCE(NULLIF(OLD.event_name, ''), event_type_label(OLD.event_type)),
    NULL,
    'event',
    OLD.id,
    jsonb_build_object('event_type', OLD.event_type, 'event_id', OLD.id),
    NULL
  );

  RETURN OLD;
END;
$$;


DROP TRIGGER IF EXISTS trg_activity_after_event_insert ON events;
CREATE TRIGGER trg_activity_after_event_insert
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION activity_after_event_insert();

DROP TRIGGER IF EXISTS trg_activity_after_event_update ON events;
CREATE TRIGGER trg_activity_after_event_update
  AFTER UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION activity_after_event_update();

DROP TRIGGER IF EXISTS trg_activity_before_event_delete ON events;
CREATE TRIGGER trg_activity_before_event_delete
  BEFORE DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION activity_before_event_delete();


CREATE OR REPLACE FUNCTION activity_after_alimtalk_transaction_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.type = 'charge' AND COALESCE(NEW.credits_change, 0) > 0 THEN
    PERFORM create_user_activity_notification(
      NEW.user_id,
      'credit_purchased',
      'credit',
      '크레딧을 충전했어요',
      NEW.credits_change::text || '크레딧이 충전되었습니다.',
      NEW.event_id,
      'alimtalk_transaction',
      NEW.id,
      jsonb_build_object(
        'credits_change', NEW.credits_change,
        'balance_after', NEW.balance_after,
        'package_id', NEW.package_id,
        'payment_platform', NEW.payment_platform
      ),
      'alimtalk_charge:' || NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_after_alimtalk_transaction_insert
  ON alimtalk_transactions;
CREATE TRIGGER trg_activity_after_alimtalk_transaction_insert
  AFTER INSERT ON alimtalk_transactions
  FOR EACH ROW
  EXECUTE FUNCTION activity_after_alimtalk_transaction_insert();


CREATE OR REPLACE FUNCTION activity_after_cover_purchase_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM create_user_activity_notification(
    NEW.user_id,
    'cover_purchased',
    'purchase',
    '내 행사 덮개를 구매했어요',
    NEW.price_credits::text || '크레딧을 사용했습니다.',
    NULL,
    'event_card_cover_purchase',
    NEW.id,
    jsonb_build_object('cover_key', NEW.cover_key, 'price_credits', NEW.price_credits),
    'cover_purchase:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_after_cover_purchase_insert
  ON event_card_cover_purchases;
CREATE TRIGGER trg_activity_after_cover_purchase_insert
  AFTER INSERT ON event_card_cover_purchases
  FOR EACH ROW
  EXECUTE FUNCTION activity_after_cover_purchase_insert();


CREATE OR REPLACE FUNCTION activity_after_guestbook_unlock_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.paid_by IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM create_user_activity_notification(
    NEW.paid_by,
    'guestbook_reception_unlocked',
    'purchase',
    '하객 접수를 활성화했어요',
    NEW.price_credits::text || '크레딧을 사용했습니다.',
    NEW.event_id,
    'guestbook_event_unlock',
    NEW.event_id,
    jsonb_build_object('price_credits', NEW.price_credits),
    'guestbook_unlock:' || NEW.event_id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_after_guestbook_unlock_insert
  ON guestbook_event_unlocks;
CREATE TRIGGER trg_activity_after_guestbook_unlock_insert
  AFTER INSERT ON guestbook_event_unlocks
  FOR EACH ROW
  EXECUTE FUNCTION activity_after_guestbook_unlock_insert();


CREATE OR REPLACE FUNCTION activity_after_guestbook_paper_purchase_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM create_user_activity_notification(
    NEW.user_id,
    'guestbook_template_purchased',
    'purchase',
    '하객 접수 템플릿을 구매했어요',
    NEW.price_credits::text || '크레딧을 사용했습니다.',
    NEW.event_id,
    'guestbook_paper_purchase',
    NULL,
    jsonb_build_object('template_id', NEW.template_id, 'price_credits', NEW.price_credits),
    'guestbook_paper:' || NEW.user_id::text || ':' || NEW.template_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_after_guestbook_paper_purchase_insert
  ON guestbook_paper_purchases;
CREATE TRIGGER trg_activity_after_guestbook_paper_purchase_insert
  AFTER INSERT ON guestbook_paper_purchases
  FOR EACH ROW
  EXECUTE FUNCTION activity_after_guestbook_paper_purchase_insert();


CREATE OR REPLACE FUNCTION activity_after_pumasi_gave_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM create_user_activity_notification(
    NEW.user_id,
    'reciprocity_marked_given',
    'reciprocity',
    '챙길 경조사를 챙겼어요',
    COALESCE(NULLIF(NEW.recipient_name, ''), '상대') || '님에게 ' ||
      COALESCE(NEW.amount, 0)::text || '원을 기록했습니다.',
    NULL,
    'pumasi_gave',
    NEW.id,
    jsonb_build_object(
      'recipient_name', NEW.recipient_name,
      'amount', NEW.amount,
      'occasion', NEW.occasion,
      'linked_guest_id', NEW.linked_guest_id
    ),
    'pumasi_gave:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_after_pumasi_gave_insert ON pumasi_gave;
CREATE TRIGGER trg_activity_after_pumasi_gave_insert
  AFTER INSERT ON pumasi_gave
  FOR EACH ROW
  EXECUTE FUNCTION activity_after_pumasi_gave_insert();


CREATE OR REPLACE FUNCTION activity_after_guest_book_verify_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_event events%ROWTYPE;
BEGIN
  IF COALESCE(OLD.is_verified, false) IS NOT DISTINCT FROM COALESCE(NEW.is_verified, false) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_event FROM events WHERE id = NEW.event_id;
  IF v_event.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM create_user_activity_notification(
    v_event.user_id,
    CASE WHEN COALESCE(NEW.is_verified, false) THEN 'guest_confirmed' ELSE 'guest_unconfirmed' END,
    'guestbook',
    CASE WHEN COALESCE(NEW.is_verified, false) THEN '부조 내역을 확정했어요' ELSE '부조 확정을 취소했어요' END,
    COALESCE(NULLIF(NEW.guest_name, ''), '하객') || ' · ' || COALESCE(NEW.amount, 0)::text || '원',
    NEW.event_id,
    'guest_book',
    NEW.id,
    jsonb_build_object('guest_name', NEW.guest_name, 'amount', NEW.amount),
    NULL
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_after_guest_book_verify_update
  ON guest_book;
CREATE TRIGGER trg_activity_after_guest_book_verify_update
  AFTER UPDATE OF is_verified ON guest_book
  FOR EACH ROW
  EXECUTE FUNCTION activity_after_guest_book_verify_update();


DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1
         FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'user_activity_notifications'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_activity_notifications;
  END IF;
END;
$$;
