-- GyeongjoApp Personal Schedules Table
-- 개인 캘린더 일정을 위한 별도 테이블 생성

-- 개인 일정 테이블 생성
CREATE TABLE IF NOT EXISTS personal_schedules (
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

-- RLS 정책 설정 (Row Level Security)
ALTER TABLE personal_schedules ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 개인 일정만 조회 가능
CREATE POLICY "Users can view own personal schedules" ON personal_schedules
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 개인 일정만 생성 가능
CREATE POLICY "Users can create own personal schedules" ON personal_schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 개인 일정만 수정 가능
CREATE POLICY "Users can update own personal schedules" ON personal_schedules
    FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 개인 일정만 삭제 가능
CREATE POLICY "Users can delete own personal schedules" ON personal_schedules
    FOR DELETE USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거 추가
CREATE TRIGGER update_personal_schedules_updated_at 
    BEFORE UPDATE ON personal_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 월별 개인 일정 조회 함수
CREATE OR REPLACE FUNCTION get_monthly_personal_schedules(user_uuid UUID, target_month DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    schedule_id UUID,
    title TEXT,
    event_type TEXT,
    event_date DATE,
    location TEXT,
    notes TEXT,
    is_reminder_set BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.id as schedule_id,
        ps.title,
        ps.event_type,
        ps.event_date,
        ps.location,
        ps.notes,
        ps.is_reminder_set
    FROM personal_schedules ps
    WHERE ps.user_id = user_uuid
      AND DATE_TRUNC('month', ps.event_date) = DATE_TRUNC('month', target_month)
    ORDER BY ps.event_date ASC;
END;
$$ LANGUAGE plpgsql;

-- 개인 일정 삽입 함수
CREATE OR REPLACE FUNCTION insert_personal_schedule(
    user_uuid UUID,
    schedule_title TEXT,
    schedule_event_type TEXT,
    schedule_date DATE,
    schedule_location TEXT DEFAULT NULL,
    schedule_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_schedule_id UUID;
BEGIN
    INSERT INTO personal_schedules (
        user_id, 
        title, 
        event_type, 
        event_date, 
        location, 
        notes
    ) VALUES (
        user_uuid,
        schedule_title,
        schedule_event_type,
        schedule_date,
        schedule_location,
        schedule_notes
    ) RETURNING id INTO new_schedule_id;
    
    RETURN new_schedule_id;
END;
$$ LANGUAGE plpgsql;

-- 사용 예시 쿼리들 (주석 처리)
/*
-- 개인 일정 생성
SELECT insert_personal_schedule(
    auth.uid(),
    '김철수 결혼식',
    'wedding',
    '2024-03-15'::DATE,
    '강남구 웨딩홀',
    '친구 결혼식, 축의금 준비'
);

-- 월별 개인 일정 조회
SELECT * FROM get_monthly_personal_schedules(auth.uid(), '2024-03-01'::DATE);

-- 개인 일정 수정
UPDATE personal_schedules 
SET title = '김철수♥이영희 결혼식', notes = '축의금 10만원 준비'
WHERE id = 'schedule-uuid' AND user_id = auth.uid();

-- 개인 일정 삭제
DELETE FROM personal_schedules 
WHERE id = 'schedule-uuid' AND user_id = auth.uid();
*/