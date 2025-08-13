-- GyeongjoApp 실제 Supabase 데이터베이스 스키마 기반 업데이트
-- 현재 데이터베이스 구조에 맞춰 누락된 시퀀스와 개선사항 추가

-- 1. 필요한 시퀀스 생성 (이벤트 번호와 기타 자동 번호)
CREATE SEQUENCE IF NOT EXISTS event_display_number_seq 
    START WITH 1000 
    INCREMENT BY 1 
    NO MAXVALUE 
    NO MINVALUE 
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS contribution_receipt_seq 
    START WITH 1 
    INCREMENT BY 1 
    NO MAXVALUE 
    NO MINVALUE 
    CACHE 1;

-- 2. events 테이블에 display_number 컬럼 추가 (없는 경우에만)
ALTER TABLE events ADD COLUMN IF NOT EXISTS display_number INTEGER DEFAULT nextval('event_display_number_seq');

-- 3. contributions 테이블에 receipt_number 컬럼 추가 (없는 경우에만)
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS receipt_number INTEGER DEFAULT nextval('contribution_receipt_seq');

-- 4. 기존 events 테이블의 title 컬럼이 없으므로 event_name을 title로 별칭 사용하는 뷰 생성
CREATE OR REPLACE VIEW events_with_title AS
SELECT 
    id,
    user_id,
    event_type,
    event_name as title,  -- event_name을 title로 매핑
    main_person_name,
    event_date,
    location,
    detailed_address,
    template_style,
    status,
    is_finalized,
    display_number,
    created_at,
    updated_at,
    -- 결혼식 관련 필드들
    bride_name,
    groom_name,
    bride_father_name,
    bride_mother_name,
    groom_father_name,
    groom_mother_name,
    bride_contact,
    groom_contact,
    ceremony_time,
    reception_time,
    custom_message,
    parking_info,
    -- 장례식 관련 필드들
    deceased_age,
    death_date,
    deceased_gender,
    casket_date,
    casket_time,
    burial_date,
    burial_time,
    burial_location,
    secondary_burial_location,
    primary_contact,
    secondary_contact,
    funeral_director,
    funeral_home,
    -- 기타 필드들
    image_urls,
    family_relations,
    preset_amounts,
    additional_info,
    allow_messages,
    message_placeholder
FROM events;

-- 5. 월별 이벤트 통계를 위한 함수 (실제 스키마에 맞춤)
CREATE OR REPLACE FUNCTION get_monthly_events(user_uuid UUID, target_month DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    event_id UUID,
    event_type TEXT,
    title TEXT,
    event_date DATE,
    location TEXT,
    status TEXT,
    contribution_count BIGINT,
    total_amount BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id as event_id,
        e.event_type,
        e.event_name as title,
        e.event_date,
        e.location,
        e.status,
        COUNT(c.id)::BIGINT as contribution_count,
        COALESCE(SUM(CASE WHEN c.is_confirmed = true THEN c.amount ELSE 0 END), 0)::BIGINT as total_amount
    FROM events e
    LEFT JOIN contributions c ON e.id = c.event_id
    WHERE e.user_id = user_uuid
      AND DATE_TRUNC('month', e.event_date) = DATE_TRUNC('month', target_month)
      AND e.status IN ('active', 'completed')
    GROUP BY e.id, e.event_type, e.event_name, e.event_date, e.location, e.status
    ORDER BY e.event_date ASC;
END;
$$ LANGUAGE plpgsql;

-- 6. 사용자 대시보드 통계 함수 (실제 스키마에 맞춤)
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE(
    total_events BIGINT,
    wedding_events BIGINT,
    funeral_events BIGINT,
    total_contributions BIGINT,
    total_amount BIGINT,
    wedding_amount BIGINT,
    funeral_amount BIGINT,
    this_month_events BIGINT,
    this_month_amount BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT e.id)::BIGINT as total_events,
        COUNT(DISTINCT CASE WHEN e.event_type = 'wedding' THEN e.id END)::BIGINT as wedding_events,
        COUNT(DISTINCT CASE WHEN e.event_type = 'funeral' THEN e.id END)::BIGINT as funeral_events,
        COUNT(c.id)::BIGINT as total_contributions,
        COALESCE(SUM(CASE WHEN c.is_confirmed = true THEN c.amount ELSE 0 END), 0)::BIGINT as total_amount,
        COALESCE(SUM(CASE WHEN e.event_type = 'wedding' AND c.is_confirmed = true THEN c.amount ELSE 0 END), 0)::BIGINT as wedding_amount,
        COALESCE(SUM(CASE WHEN e.event_type = 'funeral' AND c.is_confirmed = true THEN c.amount ELSE 0 END), 0)::BIGINT as funeral_amount,
        COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', e.event_date) = DATE_TRUNC('month', CURRENT_DATE) THEN e.id END)::BIGINT as this_month_events,
        COALESCE(SUM(CASE WHEN c.is_confirmed = true AND DATE_TRUNC('month', e.event_date) = DATE_TRUNC('month', CURRENT_DATE) THEN c.amount ELSE 0 END), 0)::BIGINT as this_month_amount
    FROM events e
    LEFT JOIN contributions c ON e.id = c.event_id
    WHERE e.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 7. 이벤트 상세 통계 함수
CREATE OR REPLACE FUNCTION get_event_contribution_stats(event_uuid UUID)
RETURNS TABLE(
    total_contributions BIGINT,
    confirmed_contributions BIGINT,
    total_amount BIGINT,
    confirmed_amount BIGINT,
    average_amount NUMERIC,
    latest_contribution TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(c.id)::BIGINT as total_contributions,
        COUNT(CASE WHEN c.is_confirmed = true THEN c.id END)::BIGINT as confirmed_contributions,
        COALESCE(SUM(c.amount), 0)::BIGINT as total_amount,
        COALESCE(SUM(CASE WHEN c.is_confirmed = true THEN c.amount ELSE 0 END), 0)::BIGINT as confirmed_amount,
        COALESCE(ROUND(AVG(CASE WHEN c.is_confirmed = true THEN c.amount::NUMERIC ELSE NULL END), 0), 0) as average_amount,
        MAX(c.created_at) as latest_contribution
    FROM contributions c
    WHERE c.event_id = event_uuid;
END;
$$ LANGUAGE plpgsql;

-- 8. 만료된 SMS 인증 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_sms_verifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sms_verifications 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 9. 트리거 함수 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. 기존 테이블에 트리거 추가 (없는 경우에만)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_events_updated_at') THEN
        CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contributions_updated_at') THEN
        CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON contributions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;