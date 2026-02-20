
-- Create payroll_cycle_status enum
DO $$ BEGIN
  CREATE TYPE public.payroll_cycle_status AS ENUM ('draft', 'verification', 'pending_approval', 'approved', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create payroll_cycles table
CREATE TABLE IF NOT EXISTS public.payroll_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status public.payroll_cycle_status NOT NULL DEFAULT 'draft',
  total_workers INTEGER NOT NULL DEFAULT 0,
  total_gross NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_net NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  paid_by UUID REFERENCES public.profiles(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payroll_cycles ENABLE ROW LEVEL SECURITY;

-- Add cycle_id to payslips
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS cycle_id UUID REFERENCES public.payroll_cycles(id);

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_payroll_officer(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('payroll_officer', 'accountant')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_finance(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('accountant', 'payroll_officer')
  )
$$;

-- RLS policies for payroll_cycles
CREATE POLICY "Admins can manage payroll cycles"
ON public.payroll_cycles AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Finance can manage payroll cycles"
ON public.payroll_cycles AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_finance(auth.uid()));

CREATE POLICY "Supervisors can view payroll cycles"
ON public.payroll_cycles AS RESTRICTIVE FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'supervisor'::app_role));

-- Payroll officers can manage payslips
CREATE POLICY "Payroll officers can manage payslips"
ON public.payslips AS RESTRICTIVE FOR ALL TO authenticated
USING (public.is_payroll_officer(auth.uid()));

-- Payroll officers can view all timesheets
CREATE POLICY "Payroll officers can view all timesheets"
ON public.timesheets AS RESTRICTIVE FOR SELECT TO authenticated
USING (public.is_payroll_officer(auth.uid()));

-- Payroll officers can view all profiles
CREATE POLICY "Payroll officers can view all profiles"
ON public.profiles AS RESTRICTIVE FOR SELECT TO authenticated
USING (public.is_payroll_officer(auth.uid()));

-- Update trigger
CREATE TRIGGER update_payroll_cycles_updated_at
BEFORE UPDATE ON public.payroll_cycles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
