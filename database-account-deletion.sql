-- 정담 계정 삭제 RPC
-- 목적: App Store 심사 대응을 위해 앱 안에서 계정 및 관련 데이터를 삭제할 수 있게 한다.
-- 실행 위치: Supabase SQL Editor
--
-- 보안 메모:
-- 현재 앱은 Supabase Auth 세션뿐 아니라 전화번호 기반 users 테이블 로그인도 사용한다.
-- 그래서 p_user_id만으로 삭제하지 않고, p_phone과 users.phone을 함께 검증한다.

CREATE OR REPLACE FUNCTION delete_jeongdam_account_v2(
  p_user_id uuid,
  p_phone text DEFAULT NULL
)
RETURNS TABLE(
  success boolean,
  deleted_user_id uuid,
  error text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user users%ROWTYPE;
  v_input_phone text;
  v_stored_phone text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 'missing_user_id'::text;
    RETURN;
  END IF;

  SELECT *
    INTO v_user
    FROM users
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, p_user_id, 'user_not_found'::text;
    RETURN;
  END IF;

  v_input_phone := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
  v_stored_phone := regexp_replace(COALESCE(v_user.phone, ''), '[^0-9]', '', 'g');

  IF v_stored_phone <> '' AND v_input_phone <> '' AND right(v_stored_phone, 10) <> right(v_input_phone, 10) THEN
    RETURN QUERY SELECT false, p_user_id, 'phone_mismatch'::text;
    RETURN;
  END IF;

  -- Storage 오브젝트는 SQL에서 직접 삭제할 수 없다.
  -- 앱의 Supabase Storage API로 먼저 삭제하고, 이 RPC에서는 DB 데이터만 삭제한다.

  -- 연결 테이블 중 ON DELETE CASCADE가 없는/불확실한 항목을 먼저 정리한다.
  IF to_regclass('public.event_reciprocity_notifications') IS NOT NULL THEN
    DELETE FROM event_reciprocity_notifications
     WHERE receiver_user_id = p_user_id;
  END IF;

  IF to_regclass('public.pumasi_gave') IS NOT NULL THEN
    DELETE FROM pumasi_gave
     WHERE user_id = p_user_id;
  END IF;

  IF to_regclass('public.paper_invitations') IS NOT NULL THEN
    DELETE FROM paper_invitations
     WHERE user_id = p_user_id;
  END IF;

  IF to_regclass('public.personal_schedules') IS NOT NULL THEN
    DELETE FROM personal_schedules
     WHERE user_id = p_user_id;
  END IF;

  IF to_regclass('public.event_members') IS NOT NULL THEN
    UPDATE event_members
       SET user_id = NULL
     WHERE user_id = p_user_id;

    UPDATE event_members
       SET invited_by = NULL
     WHERE invited_by = p_user_id;
  END IF;

  -- 행사 삭제 시 guest_book, event_members, unlocks 등 CASCADE 항목이 함께 정리된다.
  DELETE FROM events
   WHERE user_id = p_user_id;

  -- 구매/크레딧/트랜잭션 계열은 users ON DELETE CASCADE가 있으면 아래 users 삭제로 정리된다.
  DELETE FROM users
   WHERE id = p_user_id;

  -- Supabase Auth 사용자도 같은 id가 있으면 제거한다. 없거나 권한 문제가 있으면 앱 데이터 삭제는 유지한다.
  BEGIN
    DELETE FROM auth.users
     WHERE id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN QUERY SELECT true, p_user_id, NULL::text;
END;
$$;

REVOKE ALL ON FUNCTION delete_jeongdam_account_v2(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_jeongdam_account_v2(uuid, text) TO anon, authenticated;

-- 예전 함수가 storage.objects 직접 삭제 로직으로 남아있어도 앱은 v2를 호출한다.
-- 혼동 방지를 위해 기존 이름도 v2와 같은 로직으로 덮어쓴다.
CREATE OR REPLACE FUNCTION delete_jeongdam_account(
  p_user_id uuid,
  p_phone text DEFAULT NULL
)
RETURNS TABLE(
  success boolean,
  deleted_user_id uuid,
  error text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT * FROM delete_jeongdam_account_v2(p_user_id, p_phone);
$$;

REVOKE ALL ON FUNCTION delete_jeongdam_account(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_jeongdam_account(uuid, text) TO anon, authenticated;
