-- Add new patient email content fields to email_notification_configs table
-- These fields are non-editable and will always use default values from the edge function
ALTER TABLE email_notification_configs
ADD COLUMN IF NOT EXISTS patient_highlight_box_title TEXT,
ADD COLUMN IF NOT EXISTS patient_highlight_box_content TEXT,
ADD COLUMN IF NOT EXISTS patient_next_steps_title TEXT,
ADD COLUMN IF NOT EXISTS patient_next_steps_items TEXT[],
ADD COLUMN IF NOT EXISTS patient_contact_info_title TEXT,
ADD COLUMN IF NOT EXISTS patient_contact_info_content TEXT,
ADD COLUMN IF NOT EXISTS patient_closing_content TEXT;
