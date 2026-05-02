-- ============================================================================
-- 종이 청첩장 저장/조회 휴대폰 로그인 연동 보정
-- ----------------------------------------------------------------------------
-- 기존 구현은 Supabase Auth uid 기준 RLS에 묶여 있어서,
-- SOLAPI 휴대폰 로그인처럼 앱 내부 users.id로 로그인 상태를 관리하는 경우
-- "내가 만든 청첩장" 목록이 비어 보일 수 있다.
--
-- 앱에서는 앞으로 paper_invitations.user_id에 public.users.id를 저장/조회한다.
-- 기존에 익명 Supabase Auth uid로 저장된 행은 지우지 않고 그대로 둔다.
-- 그래서 FK는 NOT VALID로 추가해 기존 행 때문에 마이그레이션이 막히지 않게 한다.
-- ============================================================================

ALTER TABLE paper_invitations
  DROP CONSTRAINT IF EXISTS paper_invitations_user_id_fkey;

ALTER TABLE paper_invitations
  ADD CONSTRAINT paper_invitations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID;

ALTER TABLE paper_invitations DISABLE ROW LEVEL SECURITY;

-- 기존 저장분 확인:
--
-- SELECT id, user_id, template_id, category, groom, bride, venue, created_at
--   FROM paper_invitations
--  ORDER BY created_at DESC;
--
-- 휴대폰 로그인 사용자 확인:
--
-- SELECT id, phone, name, created_at
--   FROM users
--  ORDER BY created_at DESC;
--
-- 이미 과거 익명 Supabase Auth uid로 저장된 청첩장은 앱 계정과
-- 자동 매칭할 서버-side 근거가 없어서, 확인 후 user_id를 옮겨야 한다.
-- 필요할 때 Supabase에서 아래 형태로 실행:
--
-- UPDATE paper_invitations
--    SET user_id = '<휴대폰 로그인 users.id>'
--  WHERE user_id = '<과거 익명 auth uid>';
--
-- 현재 확인된 한태준 계정 복구 예시:
--
-- UPDATE paper_invitations
--    SET user_id = '884b0e3e-2294-4e04-9e70-073d80f37847'
--  WHERE user_id IN (
--    '83e08501-894b-401b-911e-7d6279ffa1e1',
--    '9832c5a8-4bad-483c-a9da-8f36b643618d'
--  )
--  RETURNING id, user_id, template_id, category, groom, bride, created_at;
--
-- 기존 행 정리가 끝난 뒤 FK 검증이 필요하면 실행:
--
-- ALTER TABLE paper_invitations VALIDATE CONSTRAINT paper_invitations_user_id_fkey;
