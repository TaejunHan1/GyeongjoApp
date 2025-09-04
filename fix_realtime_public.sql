-- guest_book 테이블의 실시간 기능을 위한 공개 접근 정책 수정
-- 익명 인증 없이 실시간 알림이 작동하도록 설정

-- 1. RLS 활성화 (이미 되어있을 수 있음)
ALTER TABLE guest_book ENABLE ROW LEVEL SECURITY;

-- 2. 기존 SELECT 정책들 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON guest_book;
DROP POLICY IF EXISTS "guest_book select policy" ON guest_book;
DROP POLICY IF EXISTS "Public can view all guest_book entries" ON guest_book;
DROP POLICY IF EXISTS "Enable realtime for guest_book" ON guest_book;

-- 3. 새로운 공개 SELECT 정책 생성 (익명 사용자 포함)
CREATE POLICY "Public realtime access for guest_book" 
ON guest_book 
FOR SELECT 
USING (true);

-- 4. INSERT 정책 (이미 있을 수 있지만 확인)
DROP POLICY IF EXISTS "Enable insert for all users" ON guest_book;
CREATE POLICY "Public insert for guest_book" 
ON guest_book 
FOR INSERT 
WITH CHECK (true);

-- 5. UPDATE 정책
DROP POLICY IF EXISTS "Enable update for all users" ON guest_book;
CREATE POLICY "Public update for guest_book" 
ON guest_book 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 6. 테이블 권한 확인 (anon 포함)
GRANT SELECT ON guest_book TO anon;
GRANT SELECT ON guest_book TO authenticated;
GRANT INSERT ON guest_book TO anon;
GRANT INSERT ON guest_book TO authenticated;
GRANT UPDATE ON guest_book TO anon;
GRANT UPDATE ON guest_book TO authenticated;

-- 7. 실시간 구독을 위한 추가 권한
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;

-- 8. Realtime 테이블 권한 (필요시)
GRANT SELECT ON realtime.subscription TO anon;
GRANT SELECT ON realtime.subscription TO authenticated;

-- 실행 후 확인할 수 있는 쿼리들:
-- SELECT * FROM pg_policies WHERE tablename = 'guest_book';
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'guest_book';