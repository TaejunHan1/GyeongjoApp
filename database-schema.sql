-- GyeongjoApp Database Schema for Supabase PostgreSQL
-- This file contains the complete database schema setup for the Korean event management app

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    name TEXT,
    carrier TEXT,
    auth_method TEXT DEFAULT 'phone' CHECK (auth_method IN ('phone', 'google', 'kakao')),
    profile_image_url TEXT,
    is_phone_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('wedding', 'funeral', 'baby_shower', 'birthday', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    event_time TEXT,
    location TEXT,
    address TEXT,
    postal_code TEXT,
    
    -- Event specific details
    bride_name TEXT, -- For weddings
    groom_name TEXT, -- For weddings
    deceased_name TEXT, -- For funerals
    deceased_relation TEXT, -- For funerals
    
    -- Template and styling
    template_type TEXT DEFAULT 'classic' CHECK (template_type IN ('classic', 'modern', 'garden', 'luxury', 'dark', 'memorial')),
    primary_color TEXT DEFAULT '#4A88FF',
    background_image_url TEXT,
    custom_message TEXT,
    
    -- Settings
    is_public BOOLEAN DEFAULT true,
    allow_anonymous_contributions BOOLEAN DEFAULT true,
    require_message BOOLEAN DEFAULT false,
    max_contribution_amount INTEGER,
    min_contribution_amount INTEGER,
    
    -- QR and sharing
    qr_code_url TEXT,
    share_url TEXT,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    contributor_name TEXT NOT NULL,
    contributor_phone TEXT,
    contributor_email TEXT,
    amount INTEGER NOT NULL CHECK (amount > 0),
    message TEXT,
    relationship TEXT, -- 관계 (친구, 직장동료, 가족 등)
    
    -- Payment information
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_reference TEXT,
    
    -- Metadata
    is_anonymous BOOLEAN DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_messages table (for additional messages/wishes)
CREATE TABLE IF NOT EXISTS event_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT,
    author_phone TEXT,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'wish' CHECK (message_type IN ('wish', 'memory', 'blessing', 'condolence')),
    is_approved BOOLEAN DEFAULT true,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sms_verifications table
CREATE TABLE IF NOT EXISTS sms_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_images table
CREATE TABLE IF NOT EXISTS event_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type TEXT CHECK (image_type IN ('background', 'couple', 'family', 'ceremony', 'reception', 'other')),
    display_order INTEGER DEFAULT 0,
    alt_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);

CREATE INDEX IF NOT EXISTS idx_contributions_event_id ON contributions(event_id);
CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions(created_at);
CREATE INDEX IF NOT EXISTS idx_contributions_payment_status ON contributions(payment_status);

CREATE INDEX IF NOT EXISTS idx_event_messages_event_id ON event_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_created_at ON event_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_sms_verifications_phone ON sms_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_sms_verifications_expires_at ON sms_verifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);

-- Create sequences for custom numbering (if needed)
CREATE SEQUENCE IF NOT EXISTS event_number_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS contribution_number_seq START 1;

-- Add computed columns or triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON contributions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_messages_updated_at BEFORE UPDATE ON event_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Users can view own events" ON events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public events" ON events
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own events" ON events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" ON events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" ON events
    FOR DELETE USING (auth.uid() = user_id);

-- Contributions policies
CREATE POLICY "Anyone can view contributions for public events" ON contributions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = contributions.event_id 
            AND events.is_public = true
        )
    );

CREATE POLICY "Event owners can view all contributions" ON contributions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = contributions.event_id 
            AND events.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert contributions to public events" ON contributions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = contributions.event_id 
            AND events.is_public = true 
            AND events.status = 'active'
        )
    );

-- Event messages policies
CREATE POLICY "Anyone can view approved messages for public events" ON event_messages
    FOR SELECT USING (
        is_approved = true AND
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_messages.event_id 
            AND events.is_public = true
        )
    );

CREATE POLICY "Event owners can view all messages" ON event_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_messages.event_id 
            AND events.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert messages to public events" ON event_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_messages.event_id 
            AND events.is_public = true 
            AND events.status = 'active'
        )
    );

-- Event images policies
CREATE POLICY "Anyone can view images for public events" ON event_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_images.event_id 
            AND events.is_public = true
        )
    );

CREATE POLICY "Event owners can manage event images" ON event_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_images.event_id 
            AND events.user_id = auth.uid()
        )
    );

-- SMS verifications policies (admin only)
CREATE POLICY "Service role can manage SMS verifications" ON sms_verifications
    FOR ALL USING (auth.role() = 'service_role');

-- Create storage bucket policies (run these in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);
-- 
-- CREATE POLICY "Anyone can view event images" ON storage.objects
--     FOR SELECT USING (bucket_id = 'event-images');
-- 
-- CREATE POLICY "Authenticated users can upload event images" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');
-- 
-- CREATE POLICY "Users can update own event images" ON storage.objects
--     FOR UPDATE USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);
-- 
-- CREATE POLICY "Users can delete own event images" ON storage.objects
--     FOR DELETE USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Useful queries for the app
-- 
-- Get user's events with contribution stats:
-- SELECT 
--     e.*,
--     COUNT(c.id) as contribution_count,
--     COALESCE(SUM(c.amount), 0) as total_amount
-- FROM events e
-- LEFT JOIN contributions c ON e.id = c.event_id AND c.payment_status = 'completed'
-- WHERE e.user_id = auth.uid()
-- GROUP BY e.id
-- ORDER BY e.event_date DESC;
-- 
-- Get monthly event statistics:
-- SELECT 
--     DATE_TRUNC('month', event_date) as month,
--     event_type,
--     COUNT(*) as event_count,
--     COUNT(c.id) as contribution_count,
--     COALESCE(SUM(c.amount), 0) as total_amount
-- FROM events e
-- LEFT JOIN contributions c ON e.id = c.event_id AND c.payment_status = 'completed'
-- WHERE e.user_id = auth.uid()
--   AND e.event_date >= DATE_TRUNC('year', NOW())
-- GROUP BY DATE_TRUNC('month', event_date), event_type
-- ORDER BY month DESC, event_type;