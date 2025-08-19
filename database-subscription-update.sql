-- GyeongjoApp 사용자 등급 시스템 추가
-- users 테이블에 구독 타입 및 관련 필드 추가

-- users 테이블에 subscription_type 필드 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium')),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS max_wedding_events INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_funeral_events INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_wedding_events INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_funeral_events INTEGER DEFAULT 0;

-- 기존 사용자들의 현재 이벤트 수 업데이트
UPDATE users SET 
    current_wedding_events = (
        SELECT COUNT(*) FROM events 
        WHERE events.user_id = users.id 
        AND events.event_type = 'wedding'
        AND events.status != 'cancelled'
    ),
    current_funeral_events = (
        SELECT COUNT(*) FROM events 
        WHERE events.user_id = users.id 
        AND events.event_type = 'funeral'
        AND events.status != 'cancelled'
    );

-- 프리미엄 사용자 제한 해제 (나중에 수동으로 업데이트)
-- UPDATE users SET 
--     subscription_type = 'premium',
--     max_wedding_events = NULL,
--     max_funeral_events = NULL
-- WHERE email IN ('premium@example.com');

-- 이벤트 생성/삭제 시 카운터 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_event_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 이벤트 생성 시 카운터 증가
        IF NEW.event_type = 'wedding' THEN
            UPDATE users 
            SET current_wedding_events = current_wedding_events + 1 
            WHERE id = NEW.user_id;
        ELSIF NEW.event_type = 'funeral' THEN
            UPDATE users 
            SET current_funeral_events = current_funeral_events + 1 
            WHERE id = NEW.user_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- 이벤트 삭제 시 카운터 감소
        IF OLD.event_type = 'wedding' THEN
            UPDATE users 
            SET current_wedding_events = GREATEST(current_wedding_events - 1, 0) 
            WHERE id = OLD.user_id;
        ELSIF OLD.event_type = 'funeral' THEN
            UPDATE users 
            SET current_funeral_events = GREATEST(current_funeral_events - 1, 0) 
            WHERE id = OLD.user_id;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- 이벤트 상태 변경 시 카운터 조정
        IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
            -- 취소된 경우 카운터 감소
            IF NEW.event_type = 'wedding' THEN
                UPDATE users 
                SET current_wedding_events = GREATEST(current_wedding_events - 1, 0) 
                WHERE id = NEW.user_id;
            ELSIF NEW.event_type = 'funeral' THEN
                UPDATE users 
                SET current_funeral_events = GREATEST(current_funeral_events - 1, 0) 
                WHERE id = NEW.user_id;
            END IF;
        ELSIF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
            -- 취소 해제된 경우 카운터 증가
            IF NEW.event_type = 'wedding' THEN
                UPDATE users 
                SET current_wedding_events = current_wedding_events + 1 
                WHERE id = NEW.user_id;
            ELSIF NEW.event_type = 'funeral' THEN
                UPDATE users 
                SET current_funeral_events = current_funeral_events + 1 
                WHERE id = NEW.user_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_user_event_count ON events;
CREATE TRIGGER trigger_update_user_event_count
    AFTER INSERT OR UPDATE OR DELETE ON events
    FOR EACH ROW EXECUTE FUNCTION update_user_event_count();

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON users(subscription_type);
CREATE INDEX IF NOT EXISTS idx_users_subscription_dates ON users(subscription_start_date, subscription_end_date);

-- 사용자별 이벤트 제한 체크 함수
CREATE OR REPLACE FUNCTION check_event_limit(user_uuid UUID, event_type_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_subscription TEXT;
    max_events INTEGER;
    current_events INTEGER;
BEGIN
    -- 사용자 구독 정보 조회
    SELECT subscription_type, 
           CASE 
               WHEN event_type_param = 'wedding' THEN max_wedding_events
               WHEN event_type_param = 'funeral' THEN max_funeral_events
               ELSE NULL
           END,
           CASE 
               WHEN event_type_param = 'wedding' THEN current_wedding_events
               WHEN event_type_param = 'funeral' THEN current_funeral_events
               ELSE 0
           END
    INTO user_subscription, max_events, current_events
    FROM users 
    WHERE id = user_uuid;
    
    -- 프리미엄 사용자는 제한 없음
    IF user_subscription = 'premium' THEN
        RETURN TRUE;
    END IF;
    
    -- 무료 사용자는 제한 체크
    IF max_events IS NULL OR current_events < max_events THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- RLS 정책에 구독 체크 추가 (선택사항)
-- CREATE POLICY "Users can create events within subscription limits" ON events
--     FOR INSERT WITH CHECK (
--         auth.uid() = user_id AND 
--         check_event_limit(auth.uid(), event_type)
--     );