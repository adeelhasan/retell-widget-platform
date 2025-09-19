-- Multi-Tenant Retell AI Widget SaaS Database Schema
-- Run this in your Supabase SQL Editor

-- Create widgets table
CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  retell_api_key TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  allowed_domain TEXT NOT NULL,
  button_text TEXT DEFAULT 'Start Voice Demo',
  rate_limit_calls_per_hour INTEGER, -- null = use global default
  rate_limit_enabled BOOLEAN DEFAULT true,
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
ADD CONSTRAINT check_button_text_length CHECK (char_length(button_text) <= 50);

-- Grant permissions to authenticated users
GRANT ALL ON widgets TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;