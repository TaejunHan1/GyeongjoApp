-- GyeongjoApp 실제 사용 쿼리들
-- 홈스크린과 캘린더에서 사용할 수 있는 실제 쿼리들

-- 1. 홈스크린용 - 사용자의 모든 이벤트 가져오기 (기본 정보 + 기여 통계)
/*
SELECT 
    e.id,
    e.event_type,
    e.event_name as title,
    e.main_person_name,
    e.event_date,
    e.location,
    e.status,
    e.template_style,
    e.display_number,
    e.created_at,
    -- 기여 통계
    COUNT(c.id) as contribution_count,
    COALESCE(SUM(CASE WHEN c.is_confirmed = true THEN c.amount ELSE 0 END), 0) as total_amount,
    COALESCE(COUNT(CASE WHEN c.is_confirmed = true THEN c.id END), 0) as confirmed_count
FROM events e
LEFT JOIN contributions c ON e.id = c.event_id
WHERE e.user_id = $1  -- 현재 사용자 UUID
GROUP BY e.id
ORDER BY e.event_date DESC;
*/

-- 2. 월별 캘린더용 - 특정 월의 이벤트들 가져오기
/*
SELECT 
    e.id,
    e.event_type,
    e.event_name as title,
    e.main_person_name,
    e.event_date,
    e.location,
    e.status,
    e.template_style
FROM events e
WHERE e.user_id = $1  -- 현재 사용자 UUID
  AND DATE_TRUNC('month', e.event_date) = DATE_TRUNC('month', $2::DATE)  -- 선택된 월
  AND e.status IN ('active', 'completed')
ORDER BY e.event_date ASC;
*/

-- 3. 사용자 대시보드 통계 (홈스크린 상단용)
/*
SELECT 
    -- 전체 통계
    COUNT(DISTINCT e.id) as total_events,
    COUNT(DISTINCT CASE WHEN e.event_type = 'wedding' THEN e.id END) as wedding_events,
    COUNT(DISTINCT CASE WHEN e.event_type = 'funeral' THEN e.id END) as funeral_events,
    
    -- 기여 통계
    COUNT(c.id) as total_contributions,
    COALESCE(SUM(CASE WHEN c.is_confirmed = true THEN c.amount ELSE 0 END), 0) as total_amount,
    COALESCE(SUM(CASE WHEN e.event_type = 'wedding' AND c.is_confirmed = true THEN c.amount ELSE 0 END), 0) as wedding_amount,
    COALESCE(SUM(CASE WHEN e.event_type = 'funeral' AND c.is_confirmed = true THEN c.amount ELSE 0 END), 0) as funeral_amount,
    
    -- 이번 달 통계
    COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', e.event_date) = DATE_TRUNC('month', CURRENT_DATE) THEN e.id END) as this_month_events,
    COALESCE(SUM(CASE WHEN c.is_confirmed = true AND DATE_TRUNC('month', e.event_date) = DATE_TRUNC('month', CURRENT_DATE) THEN c.amount ELSE 0 END), 0) as this_month_amount
FROM events e
LEFT JOIN contributions c ON e.id = c.event_id
WHERE e.user_id = $1;  -- 현재 사용자 UUID
*/

-- 4. 특정 이벤트의 상세 통계
/*
SELECT 
    e.id,
    e.event_type,
    e.event_name as title,
    e.main_person_name,
    e.event_date,
    e.location,
    e.status,
    
    -- 기여 통계
    COUNT(c.id) as total_contributions,
    COUNT(CASE WHEN c.is_confirmed = true THEN c.id END) as confirmed_contributions,
    COALESCE(SUM(c.amount), 0) as total_amount,
    COALESCE(SUM(CASE WHEN c.is_confirmed = true THEN c.amount ELSE 0 END), 0) as confirmed_amount,
    COALESCE(ROUND(AVG(CASE WHEN c.is_confirmed = true THEN c.amount::NUMERIC ELSE NULL END), 0), 0) as average_amount,
    MAX(c.created_at) as latest_contribution
FROM events e
LEFT JOIN contributions c ON e.id = c.event_id
WHERE e.id = $1  -- 특정 이벤트 UUID
GROUP BY e.id;
*/

-- 5. 특정 이벤트의 기여 목록
/*
SELECT 
    c.id,
    c.contributor_name,
    c.amount,
    c.relation_to,
    c.notes,
    c.is_confirmed,
    c.is_manual_entry,
    c.receipt_number,
    c.created_at
FROM contributions c
WHERE c.event_id = $1  -- 특정 이벤트 UUID
ORDER BY c.created_at DESC;
*/

-- 6. 월별 이벤트 상세 (티켓 스타일 표시용)
/*
SELECT 
    e.id,
    e.event_type,
    e.event_name as title,
    e.main_person_name,
    e.event_date,
    e.location,
    e.status,
    e.template_style,
    
    -- 기여 요약
    COUNT(c.id) as contribution_count,
    COALESCE(SUM(CASE WHEN c.is_confirmed = true THEN c.amount ELSE 0 END), 0) as total_amount,
    
    -- 최근 기여
    MAX(c.created_at) as latest_contribution_date
FROM events e
LEFT JOIN contributions c ON e.id = c.event_id
WHERE e.user_id = $1  -- 현재 사용자 UUID
  AND DATE_TRUNC('month', e.event_date) = DATE_TRUNC('month', $2::DATE)  -- 선택된 월
  AND e.status IN ('active', 'completed')
GROUP BY e.id
ORDER BY e.event_date ASC;
*/

-- 7. 이벤트 생성용 - 다음 표시 번호 가져오기
/*
SELECT nextval('event_display_number_seq') as next_display_number;
*/

-- 8. 만료된 SMS 인증 정리 (관리용)
/*
SELECT cleanup_expired_sms_verifications() as deleted_count;
*/

-- 9. 이벤트 검색 (제목, 주인공 이름으로)
/*
SELECT 
    e.id,
    e.event_type,
    e.event_name as title,
    e.main_person_name,
    e.event_date,
    e.location,
    e.status
FROM events e
WHERE e.user_id = $1  -- 현재 사용자 UUID
  AND (
    e.event_name ILIKE '%' || $2 || '%'  -- 검색어
    OR e.main_person_name ILIKE '%' || $2 || '%'
    OR (e.bride_name IS NOT NULL AND e.bride_name ILIKE '%' || $2 || '%')
    OR (e.groom_name IS NOT NULL AND e.groom_name ILIKE '%' || $2 || '%')
  )
ORDER BY e.event_date DESC;
*/

-- 10. 관계별 기여 통계 (이벤트별)
/*
SELECT 
    c.relation_to,
    COUNT(c.id) as contribution_count,
    COALESCE(SUM(CASE WHEN c.is_confirmed = true THEN c.amount ELSE 0 END), 0) as total_amount,
    COALESCE(ROUND(AVG(CASE WHEN c.is_confirmed = true THEN c.amount::NUMERIC ELSE NULL END), 0), 0) as average_amount
FROM contributions c
WHERE c.event_id = $1  -- 특정 이벤트 UUID
  AND c.relation_to IS NOT NULL
  AND c.relation_to != ''
GROUP BY c.relation_to
ORDER BY total_amount DESC;
*/