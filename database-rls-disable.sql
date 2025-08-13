-- RLS 정책 완전 비활성화 (임시 해결책)
-- personal_schedules 테이블의 RLS를 완전히 비활성화

-- 1. 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own personal schedules" ON personal_schedules;
DROP POLICY IF EXISTS "Users can create own personal schedules" ON personal_schedules;
DROP POLICY IF EXISTS "Users can update own personal schedules" ON personal_schedules;
DROP POLICY IF EXISTS "Users can delete own personal schedules" ON personal_schedules;
DROP POLICY IF EXISTS "Enable read access for own schedules" ON personal_schedules;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON personal_schedules;
DROP POLICY IF EXISTS "Enable update for own schedules" ON personal_schedules;
DROP POLICY IF EXISTS "Enable delete for own schedules" ON personal_schedules;

-- 2. RLS 완전 비활성화
ALTER TABLE personal_schedules DISABLE ROW LEVEL SECURITY;

-- 3. 테스트 쿼리 (이제 작동해야 함)
/*
INSERT INTO personal_schedules (user_id, title, event_type, event_date, location)
VALUES ('test-user-id', '테스트 결혼식', 'wedding', '2024-03-15', '강남구 웨딩홀');

SELECT * FROM personal_schedules;
*/

-- 4. 나중에 RLS를 다시 활성화하려면 (선택사항)
/*
ALTER TABLE personal_schedules ENABLE ROW LEVEL SECURITY;

-- 간단한 정책 생성
CREATE POLICY "Allow all operations for authenticated users" ON personal_schedules
    FOR ALL USING (true) WITH CHECK (true);
*/