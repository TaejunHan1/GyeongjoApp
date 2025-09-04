-- users 테이블에 푸시 알림 설정 컬럼 추가
-- 축의금 전달 시 실시간 알림을 위한 설정

-- 1. 알림 설정 관련 컬럼들 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS push_notification_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"contribution": true, "events": true, "updates": false}'::jsonb;

-- 2. 인덱스 추가 (푸시 토큰으로 빠른 검색을 위해)
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token) WHERE push_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_push_enabled ON users(push_notification_enabled) WHERE push_notification_enabled = true;

-- 3. 기존 사용자들의 알림 설정 기본값 업데이트 (optional)
UPDATE users 
SET push_notification_enabled = false,
    notification_settings = '{"contribution": true, "events": true, "updates": false}'::jsonb
WHERE push_notification_enabled IS NULL;

-- 4. 코멘트 추가
COMMENT ON COLUMN users.push_notification_enabled IS '푸시 알림 허용 여부';
COMMENT ON COLUMN users.push_token IS 'FCM/APNS 푸시 토큰';
COMMENT ON COLUMN users.notification_settings IS '알림 카테고리별 설정 (JSON)';