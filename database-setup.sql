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

-- Grant permissions to authenticated users
GRANT ALL ON widgets TO authenticated;
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
-- SECURITY FEATURES
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
-- ============================================================