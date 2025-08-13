-- GyeongjoApp 데이터베이스 롤백 SQL
-- 추가된 시퀀스와 컬럼들을 제거하는 스크립트
-- 순서가 중요합니다: 의존성이 있는 객체부터 먼저 제거

-- 1. 생성된 트리거들 제거 (가장 먼저)
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_contributions_updated_at ON contributions;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- 2. 생성된 함수들 제거
DROP FUNCTION IF EXISTS get_monthly_events(UUID, DATE);
DROP FUNCTION IF EXISTS get_user_stats(UUID);
DROP FUNCTION IF EXISTS get_event_contribution_stats(UUID);
DROP FUNCTION IF EXISTS cleanup_expired_sms_verifications();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 3. 생성된 뷰 제거 (컬럼을 참조하는 뷰부터)
DROP VIEW IF EXISTS events_with_title;

-- 4. 추가된 컬럼들 제거 (뷰 제거 후)
ALTER TABLE events DROP COLUMN IF EXISTS display_number;
ALTER TABLE contributions DROP COLUMN IF EXISTS receipt_number;

-- 5. 생성된 시퀀스들 제거 (마지막)
DROP SEQUENCE IF EXISTS event_display_number_seq;
DROP SEQUENCE IF EXISTS contribution_receipt_seq;

-- 완료 메시지
SELECT 'Database rollback completed successfully' as status;