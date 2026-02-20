
-- Add missing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'permanent',
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_salary NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS worker_type TEXT DEFAULT 'permanent',
  ADD COLUMN IF NOT EXISTS supervisor_id UUID,
  ADD COLUMN IF NOT EXISTS super_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS location TEXT;

-- Add missing columns to payroll_entries
ALTER TABLE public.payroll_entries
  ADD COLUMN IF NOT EXISTS worker_id UUID,
  ADD COLUMN IF NOT EXISTS period_start DATE,
  ADD COLUMN IF NOT EXISTS period_end DATE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'generated',
  ADD COLUMN IF NOT EXISTS gross_pay NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS super NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deductions NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employer_super NUMERIC(12,2) DEFAULT 0;

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own attendance" ON public.attendance
  FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "Workers can insert own attendance" ON public.attendance
  FOR INSERT WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "Staff can manage attendance" ON public.attendance
  FOR ALL USING (is_staff(auth.uid()));

-- Enable realtime for attendance
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;

-- Create timesheets table
CREATE TABLE IF NOT EXISTS public.timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL,
  supervisor_id UUID,
  date DATE NOT NULL,
  clock_in TEXT,
  clock_out TEXT,
  total_hours NUMERIC(8,2) DEFAULT 0,
  task_description TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own timesheets" ON public.timesheets
  FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "Staff can manage timesheets" ON public.timesheets
  FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Supervisors can manage timesheets" ON public.timesheets
  FOR ALL USING (auth.uid() = supervisor_id);

-- Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  hourly_rate NUMERIC(12,2),
  daily_rate NUMERIC(12,2),
  approved_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own contracts" ON public.contracts
  FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "Staff can manage contracts" ON public.contracts
  FOR ALL USING (is_staff(auth.uid()));

-- Create bank_details table
CREATE TABLE IF NOT EXISTS public.bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  bank_name TEXT,
  branch TEXT,
  account_name TEXT,
  account_number TEXT,
  bsb_code TEXT,
  swift_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bank details" ON public.bank_details
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own bank details" ON public.bank_details
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bank details" ON public.bank_details
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff can manage bank details" ON public.bank_details
  FOR ALL USING (is_staff(auth.uid()));

-- Create work_summaries table
CREATE TABLE IF NOT EXISTS public.work_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  summary TEXT,
  tasks_completed TEXT,
  challenges TEXT,
  next_period_goals TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.work_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own summaries" ON public.work_summaries
  FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "Workers can insert own summaries" ON public.work_summaries
  FOR INSERT WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "Staff can manage summaries" ON public.work_summaries
  FOR ALL USING (is_staff(auth.uid()));

-- Create financial_transactions table
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  related_payslip_id UUID,
  related_worker_id UUID,
  recorded_by UUID,
  category TEXT,
  reference_number TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage transactions" ON public.financial_transactions
  FOR ALL USING (is_staff(auth.uid()));

-- Create account_approvals table
CREATE TABLE IF NOT EXISTS public.account_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.account_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage approvals" ON public.account_approvals
  FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Users can view own approval" ON public.account_approvals
  FOR SELECT USING (auth.uid() = user_id);

-- Create audit_log table (singular, as referenced by hooks)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT,
  target_table TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read audit log" ON public.audit_log
  FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "System can insert audit log" ON public.audit_log
  FOR INSERT WITH CHECK (true);

-- Add auto-calculate total_hours trigger for timesheets
CREATE OR REPLACE FUNCTION public.calc_timesheet_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clock_in IS NOT NULL AND NEW.clock_out IS NOT NULL THEN
    NEW.total_hours := ROUND(
      EXTRACT(EPOCH FROM (NEW.clock_out::time - NEW.clock_in::time)) / 3600.0, 2
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER calc_timesheet_hours_trigger
  BEFORE INSERT OR UPDATE ON public.timesheets
  FOR EACH ROW EXECUTE FUNCTION public.calc_timesheet_hours();
