-- Realtime publication을 직접 SQL로 설정
-- Replication 메뉴가 Early Access로 막혀있을 때 사용

-- 1. realtime publication 확인
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- 2. guest_book 테이블을 realtime publication에 추가
ALTER PUBLICATION supabase_realtime ADD TABLE guest_book;

-- 3. 확인: publication에 포함된 테이블들 보기
SELECT 
    schemaname,
    tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 4. 실시간 권한 재확인
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;

-- 5. 추가 실시간 권한 (필요시)
GRANT ALL ON realtime.messages TO anon;
GRANT ALL ON realtime.messages TO authenticated;

-- 실행 후 확인 쿼리:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';