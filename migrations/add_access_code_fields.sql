-- Migration: Add access code fields to widgets table
-- Run this in your Supabase SQL Editor if you have an existing database

-- Add new columns
ALTER TABLE widgets
  ADD COLUMN IF NOT EXISTS access_code TEXT,
  ADD COLUMN IF NOT EXISTS require_access_code BOOLEAN DEFAULT false;

-- Add constraint for access code length
ALTER TABLE widgets
  ADD CONSTRAINT check_access_code_length
  CHECK (access_code IS NULL OR (char_length(access_code) >= 4 AND char_length(access_code) <= 50));

-- Update existing widgets to have require_access_code = false if NULL
UPDATE widgets SET require_access_code = false WHERE require_access_code IS NULL;
