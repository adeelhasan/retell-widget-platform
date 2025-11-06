-- ============================================================
-- Migration: Add Call Duration Tracking & Daily Limits
-- Date: 2025-11-01
-- Description: Track call durations and enforce daily minute limits
-- ============================================================

-- ===== STEP 1: Create call_logs table =====
CREATE TABLE IF NOT EXISTS call_logs (
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

-- ===== STEP 2: Create indexes for performance =====
-- Query by widget_id (most common)
CREATE INDEX idx_call_logs_widget_id ON call_logs(widget_id);

-- Query by date range for daily limits
CREATE INDEX idx_call_logs_started_at ON call_logs(started_at DESC);

-- Query by user for dashboard
CREATE INDEX idx_call_logs_user_id ON call_logs(user_id);

-- Composite index for daily usage queries (optimal)
CREATE INDEX idx_call_logs_widget_date ON call_logs(widget_id, started_at DESC);

-- Partial index for cron job (only pending calls)
CREATE INDEX idx_call_logs_pending ON call_logs(started_at)
  WHERE duration_seconds IS NULL;

-- ===== STEP 3: Add daily limits to widgets table =====
ALTER TABLE widgets
  ADD COLUMN IF NOT EXISTS daily_minutes_limit INTEGER,
  ADD COLUMN IF NOT EXISTS daily_minutes_enabled BOOLEAN DEFAULT false;

-- Add constraint: limit must be positive if set
ALTER TABLE widgets
  ADD CONSTRAINT check_daily_minutes_limit
  CHECK (daily_minutes_limit IS NULL OR daily_minutes_limit > 0);

-- ===== STEP 4: Enable Row Level Security on call_logs =====
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own call logs
CREATE POLICY "Users can view own call logs" ON call_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for cron job)
-- No policy needed - service role bypasses RLS

-- ===== STEP 5: Grant permissions =====
GRANT SELECT ON call_logs TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ===== STEP 6: Add comments for documentation =====
COMMENT ON TABLE call_logs IS 'Tracks all widget calls with duration for usage limits and analytics';
COMMENT ON COLUMN call_logs.duration_seconds IS 'Null until synced by cron job polling Retell API';
COMMENT ON COLUMN call_logs.call_status IS 'ongoing=active, ended=completed, error=failed';

COMMENT ON COLUMN widgets.daily_minutes_limit IS 'Maximum total call minutes per day (null = no limit)';
COMMENT ON COLUMN widgets.daily_minutes_enabled IS 'Whether daily minutes limit is enforced';

-- ===== MIGRATION COMPLETE =====
-- After running this:
-- 1. Deploy updated code with cron job
-- 2. Set CRON_SECRET environment variable
-- 3. Set CALL_LOGS_RETENTION_DAYS (optional, defaults to 7)
-- 4. Test with a widget that has daily limit enabled
