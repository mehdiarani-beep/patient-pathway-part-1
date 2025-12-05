-- Migration: remove manager role
-- Migration: remove manager role safely
-- Steps:
-- 1) Normalize existing role values that may violate clinic_members checks by mapping 'manager' and legacy 'team_member' to 'staff'
-- 2) Remove check constraint that referenced is_manager on doctor_profiles
-- 3) Drop index on is_manager
-- 4) Drop the is_manager column from doctor_profiles

BEGIN;

-- Safely normalize legacy/manager roles to 'staff' so they comply with clinic_members role CHECK
-- Map any 'manager' or 'team_member' values to 'staff' in both team_members and clinic_members
UPDATE public.team_members
SET role = 'staff'
WHERE role ILIKE 'manager' OR role ILIKE 'team_member';

-- clinic_members has a CHECK constraint limiting role to ('owner','manager','staff')
-- Convert any non-conforming or legacy roles to 'staff' before making schema changes
UPDATE public.clinic_members
SET role = 'staff'
WHERE role ILIKE 'manager' OR role ILIKE 'team_member' OR role NOT IN ('owner','manager','staff','physician');

-- If a view depends on doctor_profiles.is_manager, drop it first so we can remove the column safely.
DROP VIEW IF EXISTS public.team_member_access CASCADE;

-- Remove the constraint that enforced mutual exclusivity between is_staff and is_manager on doctor_profiles
ALTER TABLE public.doctor_profiles
DROP CONSTRAINT IF EXISTS check_team_role;

-- Drop index on is_manager if present
DROP INDEX IF EXISTS idx_doctor_profiles_is_manager;

-- Finally drop the column
ALTER TABLE public.doctor_profiles
DROP COLUMN IF EXISTS is_manager;

COMMIT;

-- Recreate a simplified `team_member_access` view that does not depend on `is_manager`.
-- This view provides a lightweight join between team_members and doctor_profiles suitable for the app.
CREATE OR REPLACE VIEW public.team_member_access AS
SELECT
	dp.access_control,
	dp.clinic_name,
	dp.doctor_id_clinic,
	tm.doctor_id AS doctor_profile_id,
	tm.email,
	tm.first_name,
	(tm.role = 'staff')::boolean AS is_staff,
	tm.last_name,
	tm.linked_user_id,
	main_dp.first_name AS main_doctor_first_name,
	main_dp.last_name AS main_doctor_last_name,
	tm.role,
	tm.status,
	tm.id AS team_member_id
FROM public.team_members tm
LEFT JOIN public.doctor_profiles dp ON dp.id = tm.doctor_id
LEFT JOIN public.doctor_profiles main_dp ON main_dp.id = dp.doctor_id_clinic;

-- Note: If your app expects additional columns or different joins, adjust this view accordingly.
-- Notes:
-- 1) Run this in Supabase SQL editor or via psql connected to your project's DB.
-- 2) If you have views or RLS policies that depend on `is_manager` (for example `team_member_access` or policies that check role IN ('owner','manager')), they may need to be updated after this migration to remove 'manager' from role lists.
-- 3) Backup your DB before running schema changes.
