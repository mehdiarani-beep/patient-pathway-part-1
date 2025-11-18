-- Add is_partial field to quiz_leads table to track partial submissions
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS is_partial boolean DEFAULT false;

-- Create index for faster queries on partial leads
CREATE INDEX IF NOT EXISTS idx_quiz_leads_is_partial ON quiz_leads(is_partial) WHERE is_partial = true;