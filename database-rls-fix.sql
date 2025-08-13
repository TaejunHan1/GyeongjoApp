-- RLS 정책 문제 해결
-- personal_schedules 테이블의 RLS 정책 수정

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own personal schedules" ON personal_schedules;
DROP POLICY IF EXISTS "Users can create own personal schedules" ON personal_schedules;
DROP POLICY IF EXISTS "Users can update own personal schedules" ON personal_schedules;
DROP POLICY IF EXISTS "Users can delete own personal schedules" ON personal_schedules;

-- 2. RLS 비활성화 (임시)
ALTER TABLE personal_schedules DISABLE ROW LEVEL SECURITY;

-- 3. RLS 다시 활성화
ALTER TABLE personal_schedules ENABLE ROW LEVEL SECURITY;

-- 4. 올바른 정책 생성
CREATE POLICY "Enable read access for own schedules" ON personal_schedules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users only" ON personal_schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own schedules" ON personal_schedules
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for own schedules" ON personal_schedules
    FOR DELETE USING (auth.uid() = user_id);

-- 5. 테스트 쿼리
/*
-- 테스트 삽입
INSERT INTO personal_schedules (user_id, title, event_type, event_date, location)
VALUES (auth.uid(), '테스트 결혼식', 'wedding', '2024-03-15', '강남구 웨딩홀');

-- 조회 테스트
SELECT * FROM personal_schedules WHERE user_id = auth.uid();
*/