-- GyeongjoApp Database Management Queries
-- Additional sequences, functions, and utility queries for Supabase

-- =================================
-- SEQUENCES AND AUTO-NUMBERING
-- =================================

-- Event numbering sequence (for display purposes)
CREATE SEQUENCE IF NOT EXISTS event_display_number_seq 
    START WITH 1000 
    INCREMENT BY 1 
    NO MAXVALUE 
    NO MINVALUE 
    CACHE 1;

-- Contribution receipt numbering
CREATE SEQUENCE IF NOT EXISTS contribution_receipt_seq 
    START WITH 1 
    INCREMENT BY 1 
    NO MAXVALUE 
    NO MINVALUE 
    CACHE 1;

-- Add display number columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS display_number INTEGER DEFAULT nextval('event_display_number_seq');
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS receipt_number INTEGER DEFAULT nextval('contribution_receipt_seq');

-- =================================
-- UTILITY FUNCTIONS
-- =================================

-- Function to generate event share URL
CREATE OR REPLACE FUNCTION generate_event_share_url(event_uuid UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN 'https://gyeongjo.app/event/' || event_uuid::text;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate event statistics
CREATE OR REPLACE FUNCTION get_event_stats(event_uuid UUID)
RETURNS TABLE(
    total_contributions BIGINT,
    total_amount BIGINT,
    average_amount NUMERIC,
    latest_contribution TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(c.id)::BIGINT as total_contributions,
        COALESCE(SUM(c.amount), 0)::BIGINT as total_amount,
        COALESCE(ROUND(AVG(c.amount), 0), 0) as average_amount,
        MAX(c.created_at) as latest_contribution
    FROM contributions c
    WHERE c.event_id = event_uuid 
      AND c.payment_status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly user statistics
CREATE OR REPLACE FUNCTION get_user_monthly_stats(user_uuid UUID, target_month DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
    total_events BIGINT,
    wedding_events BIGINT,
    funeral_events BIGINT,
    total_contributions BIGINT,
    total_amount BIGINT,
    wedding_amount BIGINT,
    funeral_amount BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT e.id)::BIGINT as total_events,
        COUNT(DISTINCT CASE WHEN e.event_type = 'wedding' THEN e.id END)::BIGINT as wedding_events,
        COUNT(DISTINCT CASE WHEN e.event_type = 'funeral' THEN e.id END)::BIGINT as funeral_events,
        COUNT(c.id)::BIGINT as total_contributions,
        COALESCE(SUM(c.amount), 0)::BIGINT as total_amount,
        COALESCE(SUM(CASE WHEN e.event_type = 'wedding' THEN c.amount ELSE 0 END), 0)::BIGINT as wedding_amount,
        COALESCE(SUM(CASE WHEN e.event_type = 'funeral' THEN c.amount ELSE 0 END), 0)::BIGINT as funeral_amount
    FROM events e
    LEFT JOIN contributions c ON e.id = c.event_id AND c.payment_status = 'completed'
    WHERE e.user_id = user_uuid
      AND DATE_TRUNC('month', e.event_date) = DATE_TRUNC('month', target_month);
END;
$$ LANGUAGE plpgsql;

-- =================================
-- VIEWS FOR COMMON QUERIES
-- =================================

-- View for event summary with contribution stats
CREATE OR REPLACE VIEW event_summary AS
SELECT 
    e.id,
    e.user_id,
    e.event_type,
    e.title,
    e.event_date,
    e.location,
    e.status,
    e.template_type,
    e.is_public,
    e.display_number,
    COUNT(c.id) as contribution_count,
    COALESCE(SUM(CASE WHEN c.payment_status = 'completed' THEN c.amount ELSE 0 END), 0) as total_amount,
    COALESCE(AVG(CASE WHEN c.payment_status = 'completed' THEN c.amount::NUMERIC ELSE NULL END), 0) as average_amount,
    MAX(c.created_at) as latest_contribution,
    e.created_at,
    e.updated_at
FROM events e
LEFT JOIN contributions c ON e.id = c.event_id
GROUP BY e.id;

-- View for user dashboard statistics
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    u.id as user_id,
    u.name,
    u.phone,
    COUNT(DISTINCT e.id) as total_events,
    COUNT(DISTINCT CASE WHEN e.event_type = 'wedding' THEN e.id END) as wedding_events,
    COUNT(DISTINCT CASE WHEN e.event_type = 'funeral' THEN e.id END) as funeral_events,
    COUNT(c.id) as total_contributions,
    COALESCE(SUM(CASE WHEN c.payment_status = 'completed' THEN c.amount ELSE 0 END), 0) as total_amount,
    -- This month stats
    COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', e.event_date) = DATE_TRUNC('month', CURRENT_DATE) THEN e.id END) as this_month_events,
    COALESCE(SUM(CASE WHEN c.payment_status = 'completed' AND DATE_TRUNC('month', e.event_date) = DATE_TRUNC('month', CURRENT_DATE) THEN c.amount ELSE 0 END), 0) as this_month_amount
FROM users u
LEFT JOIN events e ON u.id = e.user_id
LEFT JOIN contributions c ON e.id = c.event_id
GROUP BY u.id, u.name, u.phone;

-- =================================
-- CLEANUP PROCEDURES
-- =================================

-- Function to clean up expired SMS verifications
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

-- Function to soft delete old draft events (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_draft_events()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE events 
    SET status = 'cancelled', updated_at = NOW()
    WHERE status = 'draft' 
      AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =================================
-- USEFUL QUERIES FOR THE APP
-- =================================

-- Get user's events with contribution details for HomeScreen
/*
SELECT 
    e.id,
    e.title,
    e.event_type,
    e.event_date,
    e.location,
    e.status,
    e.template_type,
    e.display_number,
    es.contribution_count,
    es.total_amount,
    es.average_amount,
    es.latest_contribution
FROM event_summary es
JOIN events e ON es.id = e.id
WHERE e.user_id = auth.uid()
ORDER BY e.event_date DESC;
*/

-- Get monthly calendar events for specific month
/*
SELECT 
    id,
    title,
    event_type,
    event_date,
    location,
    template_type
FROM events
WHERE user_id = auth.uid()
  AND DATE_TRUNC('month', event_date) = DATE_TRUNC('month', $1::DATE)
  AND status IN ('active', 'completed')
ORDER BY event_date ASC;
*/

-- Get contribution details for specific event
/*
SELECT 
    c.id,
    c.contributor_name,
    c.amount,
    c.message,
    c.relationship,
    c.payment_status,
    c.receipt_number,
    c.created_at
FROM contributions c
WHERE c.event_id = $1
  AND c.payment_status = 'completed'
ORDER BY c.created_at DESC;
*/

-- Get user's cumulative statistics
/*
SELECT 
    total_events,
    wedding_events,
    funeral_events,
    total_contributions,
    total_amount,
    this_month_events,
    this_month_amount
FROM user_dashboard_stats
WHERE user_id = auth.uid();
*/

-- Get event statistics for dashboard
/*
SELECT * FROM get_event_stats($1::UUID);
*/

-- Get monthly user statistics
/*
SELECT * FROM get_user_monthly_stats(auth.uid(), $1::DATE);
*/

-- =================================
-- SCHEDULED FUNCTIONS (run via pg_cron if available)
-- =================================

-- Schedule cleanup of expired SMS verifications (every hour)
/*
SELECT cron.schedule(
    'cleanup-sms-verifications',
    '0 * * * *',  -- Every hour
    'SELECT cleanup_expired_sms_verifications();'
);
*/

-- Schedule cleanup of old draft events (daily at 2 AM)
/*
SELECT cron.schedule(
    'cleanup-draft-events',
    '0 2 * * *',  -- Daily at 2 AM
    'SELECT cleanup_old_draft_events();'
);
*/

-- =================================
-- BACKUP AND MAINTENANCE
-- =================================

-- Create backup tables (optional)
/*
CREATE TABLE events_backup AS SELECT * FROM events WHERE FALSE;
CREATE TABLE contributions_backup AS SELECT * FROM contributions WHERE FALSE;

-- Function to backup events and contributions
CREATE OR REPLACE FUNCTION backup_event_data(event_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO events_backup SELECT * FROM events WHERE id = event_uuid;
    INSERT INTO contributions_backup SELECT * FROM contributions WHERE event_id = event_uuid;
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
*/