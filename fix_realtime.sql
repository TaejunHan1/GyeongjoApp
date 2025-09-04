-- guest_book 테이블의 실시간 기능을 위한 RLS 정책 수정

-- 1. RLS 활성화 (이미 되어있을 수 있음)
ALTER TABLE guest_book ENABLE ROW LEVEL SECURITY;

-- 2. 기존 SELECT 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Enable read access for all users" ON guest_book;
DROP POLICY IF EXISTS "guest_book select policy" ON guest_book;
DROP POLICY IF EXISTS "Public can view all guest_book entries" ON guest_book;

-- 3. 새로운 SELECT 정책 생성 (모든 사용자가 읽을 수 있도록)
CREATE POLICY "Enable realtime for guest_book" 
ON guest_book 
FOR SELECT 
USING (true);

-- 4. INSERT 정책 (이미 있을 수 있지만 확인)
CREATE POLICY IF NOT EXISTS "Enable insert for all users" 
ON guest_book 
FOR INSERT 
WITH CHECK (true);

-- 5. UPDATE 정책
CREATE POLICY IF NOT EXISTS "Enable update for all users" 
ON guest_book 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 6. Realtime 활성화 확인
-- Supabase 대시보드에서 Database → Replication 으로 가서
-- guest_book 테이블의 Toggle을 켜주세요

-- 7. 테이블 권한 확인
GRANT SELECT ON guest_book TO anon;
GRANT SELECT ON guest_book TO authenticated;
GRANT INSERT ON guest_book TO anon;
GRANT INSERT ON guest_book TO authenticated;

-- 8. 실시간 구독을 위한 추가 권한
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;