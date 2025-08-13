-- GyeongjoApp Personal Schedules Table 수정
-- is_reminder_set 컬럼 추가 및 기타 누락된 컬럼 수정

-- 1. 기존 테이블 구조 확인 (Supabase SQL Editor에서 실행)
/*
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'personal_schedules' 
ORDER BY ordinal_position;
*/

-- 2. 누락된 컬럼들 추가
ALTER TABLE personal_schedules ADD COLUMN IF NOT EXISTS is_reminder_set BOOLEAN DEFAULT false;
ALTER TABLE personal_schedules ADD COLUMN IF NOT EXISTS reminder_time TIMESTAMP WITH TIME ZONE;

-- 3. 테이블이 존재하지 않는 경우를 대비한 완전한 재생성 스크립트
-- (위의 ALTER가 실패하면 아래 CREATE 문을 사용)

/*
-- 기존 테이블 삭제 (데이터가 있다면 백업 후 실행)
DROP TABLE IF EXISTS personal_schedules CASCADE;

-- 개인 일정 테이블 재생성 (완전한 스키마)
CREATE TABLE personal_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    event_type TEXT CHECK (event_type IN ('wedding', 'funeral', 'birthday', 'anniversary', 'reminder', 'other')) NOT NULL,
    event_date DATE NOT NULL,
    location TEXT,
    notes TEXT,
    reminder_time TIMESTAMP WITH TIME ZONE,
    is_reminder_set BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_personal_schedules_user_id ON personal_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_schedules_date ON personal_schedules(event_date);
CREATE INDEX IF NOT EXISTS idx_personal_schedules_user_date ON personal_schedules(user_id, event_date);

-- RLS 정책 설정
ALTER TABLE personal_schedules ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Users can view own personal schedules" ON personal_schedules;
DROP POLICY IF EXISTS "Users can create own personal schedules" ON personal_schedules;
DROP POLICY IF EXISTS "Users can update own personal schedules" ON personal_schedules;
DROP POLICY IF EXISTS "Users can delete own personal schedules" ON personal_schedules;

-- RLS 정책 재생성
CREATE POLICY "Users can view own personal schedules" ON personal_schedules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own personal schedules" ON personal_schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal schedules" ON personal_schedules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personal schedules" ON personal_schedules
    FOR DELETE USING (auth.uid() = user_id);

-- updated_at 트리거 재생성
DROP TRIGGER IF EXISTS update_personal_schedules_updated_at ON personal_schedules;
CREATE TRIGGER update_personal_schedules_updated_at 
    BEFORE UPDATE ON personal_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
*/

-- 4. 테스트 쿼리 (데이터 확인)
/*
-- 테이블 구조 재확인
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'personal_schedules' 
ORDER BY ordinal_position;

-- 테스트 데이터 삽입 (선택사항)
INSERT INTO personal_schedules (
    user_id, 
    title, 
    event_type, 
    event_date, 
    location, 
    notes,
    is_reminder_set
) VALUES (
    auth.uid(),
    '테스트 결혼식',
    'wedding',
    '2024-03-15'::DATE,
    '강남구 웨딩홀',
    '친구 결혼식 참석',
    false
);

-- 데이터 조회 테스트
SELECT * FROM personal_schedules WHERE user_id = auth.uid();
*/