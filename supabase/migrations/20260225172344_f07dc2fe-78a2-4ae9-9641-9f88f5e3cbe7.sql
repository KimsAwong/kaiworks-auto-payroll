
-- =====================================================
-- Phase 1: Extend existing tables for full payroll workflow
-- =====================================================

-- 1. Add missing employee fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tin text,
  ADD COLUMN IF NOT EXISTS nasfund_number text,
  ADD COLUMN IF NOT EXISTS bank_account text,
  ADD COLUMN IF NOT EXISTS employee_id text,
  ADD COLUMN IF NOT EXISTS project_site text,
  ADD COLUMN IF NOT EXISTS base_salary numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS worker_type text DEFAULT 'permanent',
  ADD COLUMN IF NOT EXISTS is_resident boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS super_enabled boolean DEFAULT true;

-- 2. Extend timesheets with overtime, allowances, clerk verification
ALTER TABLE public.timesheets
  ADD COLUMN IF NOT EXISTS clerk_id uuid,
  ADD COLUMN IF NOT EXISTS ordinary_hours numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overtime_hours numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS allowance_type text,
  ADD COLUMN IF NOT EXISTS allowance_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clerk_verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS submitted_to_clerk_at timestamp with time zone;

-- Add foreign key for clerk_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'timesheets_clerk_id_fkey'
  ) THEN
    ALTER TABLE public.timesheets
      ADD CONSTRAINT timesheets_clerk_id_fkey
      FOREIGN KEY (clerk_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- 3. Extend payslips with YTD and leave balances
ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS ytd_tax numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ytd_super numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leave_balance_annual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leave_balance_sick numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS overtime_pay numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS allowance_pay numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_deduction numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nasfund_deduction numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_deductions numeric DEFAULT 0;

-- 4. Add new timesheet statuses to the enum
-- We need to add 'supervisor_approved' and 'clerk_verified' to timesheet_status
ALTER TYPE public.timesheet_status ADD VALUE IF NOT EXISTS 'supervisor_approved';
ALTER TYPE public.timesheet_status ADD VALUE IF NOT EXISTS 'clerk_verified';

-- 5. RLS: Clerks can also insert timesheets (for editing during verification)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Clerks can insert timesheets'
  ) THEN
    CREATE POLICY "Clerks can insert timesheets"
    ON public.timesheets
    FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'clerk'::app_role));
  END IF;
END $$;

-- 6. Allow supervisors to view their own profile (for self-service)
-- Already exists via "Users can view own profile"

-- 7. Create index for faster timesheet queries by status
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON public.timesheets(status);
CREATE INDEX IF NOT EXISTS idx_timesheets_date ON public.timesheets(date);
CREATE INDEX IF NOT EXISTS idx_timesheets_clerk_id ON public.timesheets(clerk_id);
