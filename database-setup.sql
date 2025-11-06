-- Multi-Tenant Retell AI Widget SaaS Database Schema
-- Run this in your Supabase SQL Editor
-- This schema includes all fields needed for the Retell Widget Platform

-- Create widget type enum
CREATE TYPE widget_type AS ENUM ('inbound_web', 'inbound_phone', 'outbound_phone', 'outbound_web');

-- Create widgets table
CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  retell_api_key TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  allowed_domain TEXT NOT NULL,
  widget_type widget_type DEFAULT 'inbound_web' NOT NULL,
  button_text TEXT,
  rate_limit_calls_per_hour INTEGER, -- null = use global default
  rate_limit_enabled BOOLEAN DEFAULT true,
  daily_minutes_limit INTEGER, -- Maximum total call minutes per day (null = no limit)
  daily_minutes_enabled BOOLEAN DEFAULT false, -- Whether daily minutes limit is enforced
  access_code TEXT, -- Optional access code for widget protection
  require_access_code BOOLEAN DEFAULT false, -- Whether access code is required

  -- Optional fields for different widget types
  display_text TEXT, -- Custom display text for widget
  agent_persona TEXT, -- Agent persona for outbound_web widgets
  opening_message TEXT, -- Opening message for outbound calls
  inbound_phone_number TEXT, -- Phone number for inbound_phone widgets (auto-populated by system)
  outbound_phone_number TEXT, -- From phone number for outbound_phone widgets

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only access their own widgets
CREATE POLICY "Users can manage own widgets" ON widgets 
FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_widgets_user_id ON widgets(user_id);
CREATE INDEX idx_widgets_created_at ON widgets(created_at);

-- Add constraints
ALTER TABLE widgets 
ADD CONSTRAINT check_name_length CHECK (char_length(name) > 0 AND char_length(name) <= 100);

ALTER TABLE widgets 
ADD CONSTRAINT check_retell_api_key_format CHECK (retell_api_key LIKE 'key_%');

ALTER TABLE widgets 
ADD CONSTRAINT check_agent_id_format CHECK (agent_id LIKE 'agent_%');

ALTER TABLE widgets
ADD CONSTRAINT check_button_text_length CHECK (button_text IS NULL OR char_length(button_text) <= 50);

ALTER TABLE widgets
ADD CONSTRAINT check_access_code_length CHECK (access_code IS NULL OR (char_length(access_code) >= 4 AND char_length(access_code) <= 50));

ALTER TABLE widgets
ADD CONSTRAINT check_agent_persona_length CHECK (agent_persona IS NULL OR char_length(agent_persona) <= 100);

ALTER TABLE widgets
ADD CONSTRAINT check_opening_message_length CHECK (opening_message IS NULL OR char_length(opening_message) <= 500);

ALTER TABLE widgets
ADD CONSTRAINT check_phone_number_format CHECK (
  (inbound_phone_number IS NULL OR inbound_phone_number ~ '^\+[1-9]\d{10,14}$') AND
  (outbound_phone_number IS NULL OR outbound_phone_number ~ '^\+[1-9]\d{10,14}$')
);

ALTER TABLE widgets
ADD CONSTRAINT check_daily_minutes_limit CHECK (daily_minutes_limit IS NULL OR daily_minutes_limit > 0);

-- Grant permissions to authenticated users
GRANT ALL ON widgets TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================
-- CALL LOGS TABLE FOR USAGE TRACKING
-- ============================================================

-- Create call_logs table
CREATE TABLE call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  call_id TEXT NOT NULL UNIQUE,
  call_type TEXT NOT NULL CHECK (call_type IN ('inbound_web', 'inbound_phone', 'outbound_phone', 'outbound_web')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  duration_seconds INTEGER, -- null until synced via polling
  call_status TEXT DEFAULT 'ongoing' CHECK (call_status IN ('ongoing', 'ended', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on call_logs
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own call logs
CREATE POLICY "Users can view own call logs" ON call_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_call_logs_widget_id ON call_logs(widget_id);
CREATE INDEX idx_call_logs_started_at ON call_logs(started_at DESC);
CREATE INDEX idx_call_logs_user_id ON call_logs(user_id);
CREATE INDEX idx_call_logs_widget_date ON call_logs(widget_id, started_at DESC);
CREATE INDEX idx_call_logs_pending ON call_logs(started_at) WHERE duration_seconds IS NULL;

-- Grant permissions
GRANT SELECT ON call_logs TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================
-- WIDGET TYPES AND FIELD USAGE GUIDE
-- ============================================================
--
-- inbound_web: Browser-based voice call initiated by user
--   Required: retell_api_key, agent_id, allowed_domain
--   Optional: button_text, display_text, access_code
--
-- inbound_phone: User calls a phone number
--   Required: retell_api_key, agent_id, allowed_domain
--   Optional: button_text, display_text, access_code
--   Note: inbound_phone_number is auto-populated by the system
--
-- outbound_phone: System calls user's phone number
--   Required: retell_api_key, agent_id, allowed_domain, outbound_phone_number
--   Optional: button_text, display_text, opening_message, access_code
--
-- outbound_web: Simulates incoming call in browser
--   Required: retell_api_key, agent_id, allowed_domain
--   Optional: button_text, display_text, agent_persona, opening_message, access_code
--
-- ============================================================
-- SECURITY & USAGE FEATURES
-- ============================================================
--
-- access_code + require_access_code:
--   Enable to require users to enter a password before using widget
--   Use cases: private demos, beta testing, internal tools
--
-- button_text:
--   Custom button text (leave NULL to use widget-type defaults)
--   Defaults applied at render time based on widget_type
--
-- daily_minutes_limit + daily_minutes_enabled:
--   Control costs by limiting total call minutes per day
--   Example: Set to 60 to allow max 60 minutes of calls per day
--   Resets at midnight UTC
--   Call durations tracked in call_logs table via cron job
--
-- call_logs table:
--   Tracks all widget calls for usage analytics and limits
--   duration_seconds starts as NULL, filled by cron job polling Retell API
--   Old records auto-deleted after retention period (default 7 days)
--   Cron job runs every 10 minutes to sync durations and cleanup
--
-- Environment variables needed for usage tracking:
--   CRON_SECRET: Secret for authenticating cron job requests
--   CALL_LOGS_RETENTION_DAYS: Days to keep logs (default: 7)
--
-- ============================================================