-- Add Contact Form Fields to Widgets Table
-- Migration for adding pre-call contact form feature
-- Created: 2025-11-18

-- Add contact form fields to widgets table
ALTER TABLE widgets
ADD COLUMN contact_form_enabled BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN collector_email TEXT;

-- Add email validation constraint
ALTER TABLE widgets
ADD CONSTRAINT check_collector_email_format
CHECK (
  collector_email IS NULL OR
  collector_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
);

-- Add comment for documentation
COMMENT ON COLUMN widgets.contact_form_enabled IS 'When enabled, shows contact form before initiating voice call';
COMMENT ON COLUMN widgets.collector_email IS 'Email address where contact form submissions will be sent';

-- Create contact_form_submissions table for logging
CREATE TABLE IF NOT EXISTS contact_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on contact_form_submissions
ALTER TABLE contact_form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own form submissions
CREATE POLICY "Users can view own contact form submissions" ON contact_form_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_contact_form_submissions_widget_id ON contact_form_submissions(widget_id);
CREATE INDEX idx_contact_form_submissions_user_id ON contact_form_submissions(user_id);
CREATE INDEX idx_contact_form_submissions_submitted_at ON contact_form_submissions(submitted_at DESC);

-- Add constraints for data validation
ALTER TABLE contact_form_submissions
ADD CONSTRAINT check_submission_name_length CHECK (char_length(name) > 0 AND char_length(name) <= 100);

ALTER TABLE contact_form_submissions
ADD CONSTRAINT check_submission_company_length CHECK (char_length(company) > 0 AND char_length(company) <= 100);

ALTER TABLE contact_form_submissions
ADD CONSTRAINT check_submission_email_format
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Grant permissions to authenticated users
GRANT SELECT ON contact_form_submissions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE contact_form_submissions IS 'Stores contact form submissions from widgets for audit trail and analytics';
COMMENT ON COLUMN contact_form_submissions.name IS 'Contact name from form submission';
COMMENT ON COLUMN contact_form_submissions.company IS 'Company name from form submission';
COMMENT ON COLUMN contact_form_submissions.email IS 'Contact email from form submission';
