-- Add unique constraint on (doctor_id, quiz_type) for email_notification_configs
-- This allows upsert operations to work with ON CONFLICT
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

