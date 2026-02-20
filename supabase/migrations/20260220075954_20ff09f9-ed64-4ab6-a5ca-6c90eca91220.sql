
-- Step 1: Add 'clerk' to the app_role enum (must be committed separately)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'clerk';
