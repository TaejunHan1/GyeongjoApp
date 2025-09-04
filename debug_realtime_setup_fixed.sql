-- Realtime 설정 디버깅 및 추가 권한 부여 (수정 버전)

-- 1. 현재 publication 상태 확인
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 2. 테이블 소유자 확인 (컬럼명 수정)
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'guest_book';

-- 3. RLS 정책 상태 재확인
SELECT * FROM pg_policies WHERE tablename = 'guest_book';

-- 4. 추가 권한 부여 (더 광범위한 권한)
GRANT ALL PRIVILEGES ON guest_book TO anon;
GRANT ALL PRIVILEGES ON guest_book TO authenticated;
GRANT ALL PRIVILEGES ON guest_book TO postgres;

-- 5. realtime 스키마 전체 권한
GRANT ALL ON SCHEMA realtime TO anon;
GRANT ALL ON SCHEMA realtime TO authenticated;
GRANT ALL ON SCHEMA realtime TO postgres;

-- 6. realtime 관련 모든 테이블 권한
GRANT ALL ON ALL TABLES IN SCHEMA realtime TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA realtime TO authenticated;

-- 7. publication 권한 재설정
ALTER PUBLICATION supabase_realtime SET (publish = 'insert,update,delete');

-- 8. 시퀀스 권한도 부여
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 9. 특별히 guest_book 테이블 재확인
GRANT SELECT, INSERT, UPDATE, DELETE ON guest_book TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON guest_book TO authenticated;

-- 실행 후 확인:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'guest_book';