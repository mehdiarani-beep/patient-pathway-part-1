-- Add footer content fields to email_notification_configs table
ALTER TABLE email_notification_configs
ADD COLUMN footer_address_1 TEXT DEFAULT '814 E Woodfield, Schaumburg, IL 60173',
ADD COLUMN footer_address_2 TEXT DEFAULT '735 N. Perryville Rd. Suite 4, Rockford, IL 61107',
ADD COLUMN footer_hours TEXT DEFAULT 'Monday - Thursday 8:00 am - 5:00 pm\nFriday - 9:00 am - 5:00 pm',
ADD COLUMN footer_phone_numbers TEXT[] DEFAULT ARRAY['224-529-4697', '815-977-5715', '815-281-5803'],
ADD COLUMN footer_quick_links TEXT[] DEFAULT ARRAY['Sinus Pain', 'Sinus Headaches', 'Sinus Quiz', 'Nasal & Sinus Procedures', 'Privacy Policy', 'Accessibility Statement'],
ADD COLUMN footer_appointment_button_text TEXT DEFAULT 'Request an appointment',
ADD COLUMN footer_appointment_button_url TEXT DEFAULT '#';