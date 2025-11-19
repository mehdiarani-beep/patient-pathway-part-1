-- Complete update for email_notification_configs table
-- This migration includes all necessary fields and constraints

-- 1. Add unique constraint on (doctor_id, quiz_type) for upsert operations
-- Drop constraint if it exists, then add it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'email_notification_configs_doctor_quiz_unique'
    ) THEN
        ALTER TABLE public.email_notification_configs
        DROP CONSTRAINT email_notification_configs_doctor_quiz_unique;
    END IF;
END $$;

ALTER TABLE public.email_notification_configs
ADD CONSTRAINT email_notification_configs_doctor_quiz_unique 
UNIQUE (doctor_id, quiz_type);

-- 2. Add footer content fields (if not already added)
ALTER TABLE public.email_notification_configs
ADD COLUMN IF NOT EXISTS footer_address_1 TEXT,
ADD COLUMN IF NOT EXISTS footer_address_2 TEXT,
ADD COLUMN IF NOT EXISTS footer_hours TEXT,
ADD COLUMN IF NOT EXISTS footer_phone_numbers TEXT[],
ADD COLUMN IF NOT EXISTS footer_quick_links TEXT[],
ADD COLUMN IF NOT EXISTS footer_appointment_button_text TEXT,
ADD COLUMN IF NOT EXISTS footer_appointment_button_url TEXT;

-- 3. Add new patient email content fields (non-editable, use defaults from edge function)
ALTER TABLE public.email_notification_configs
ADD COLUMN IF NOT EXISTS patient_highlight_box_title TEXT,
ADD COLUMN IF NOT EXISTS patient_highlight_box_content TEXT,
ADD COLUMN IF NOT EXISTS patient_next_steps_title TEXT,
ADD COLUMN IF NOT EXISTS patient_next_steps_items TEXT[],
ADD COLUMN IF NOT EXISTS patient_contact_info_title TEXT,
ADD COLUMN IF NOT EXISTS patient_contact_info_content TEXT,
ADD COLUMN IF NOT EXISTS patient_closing_content TEXT;

