
-- ============================================
-- WorkFlow PNG - Complete Database Schema
-- ============================================

-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('ceo', 'manager', 'supervisor', 'worker', 'accountant');

-- 2. Create approval status enum
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- 3. Create employment type enum
CREATE TYPE public.employment_type AS ENUM ('permanent', 'temporary');

-- 4. Create timesheet status enum
CREATE TYPE public.timesheet_status AS ENUM ('pending', 'approved', 'flagged', 'rejected');

-- 5. Create payslip status enum
CREATE TYPE public.payslip_status AS ENUM ('draft', 'generated', 'paid');

-- 6. Create transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('payroll', 'expense', 'reimbursement', 'bonus', 'deduction');

-- ============================================
-- USER ROLES TABLE
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'worker',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  department TEXT,
  employment_type employment_type NOT NULL DEFAULT 'permanent',
  supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  avatar_url TEXT,
  location TEXT DEFAULT 'Port Moresby',
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  account_status approval_status NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BANK DETAILS TABLE
-- ============================================
CREATE TABLE public.bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bank_name TEXT NOT NULL DEFAULT '',
  branch TEXT DEFAULT '',
  account_name TEXT NOT NULL DEFAULT '',
  account_number TEXT NOT NULL DEFAULT '',
  bsb_code TEXT DEFAULT '',
  swift_code TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CONTRACTS TABLE (for temporary workers)
-- ============================================
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_rate NUMERIC(10,2),
  hourly_rate NUMERIC(10,2),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TIMESHEETS TABLE
-- ============================================
CREATE TABLE public.timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  supervisor_id UUID REFERENCES public.profiles(id) NOT NULL,
  date DATE NOT NULL,
  clock_in TIME NOT NULL,
  clock_out TIME NOT NULL,
  total_hours NUMERIC(5,2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600.0
  ) STORED,
  task_description TEXT,
  status timesheet_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PAYSLIPS TABLE
-- ============================================
CREATE TABLE public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  gross_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
  deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
  status payslip_status NOT NULL DEFAULT 'draft',
  generated_by UUID REFERENCES public.profiles(id),
  paid_by UUID REFERENCES public.profiles(id),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MESSAGES TABLE (Chat system)
-- ============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_broadcast BOOLEAN NOT NULL DEFAULT false,
  broadcast_to_role app_role,
  is_system_message BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================
-- FINANCIAL TRANSACTIONS TABLE (Accounts section)
-- ============================================
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type transaction_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  related_payslip_id UUID REFERENCES public.payslips(id) ON DELETE SET NULL,
  related_worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recorded_by UUID REFERENCES public.profiles(id) NOT NULL,
  category TEXT,
  reference_number TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ACCOUNT APPROVAL REQUESTS TABLE
-- ============================================
CREATE TABLE public.account_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requested_role app_role NOT NULL DEFAULT 'worker',
  status approval_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.account_approvals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- ============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is CEO or Manager
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('ceo', 'manager')
  )
$$;

-- Check if user is supervisor of a specific worker
CREATE OR REPLACE FUNCTION public.is_supervisor_of(_supervisor_id UUID, _worker_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _worker_id AND supervisor_id = _supervisor_id
  )
$$;

-- Check if user is accountant
CREATE OR REPLACE FUNCTION public.is_accountant(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'accountant'
  )
$$;

-- Get user's supervisor ID
CREATE OR REPLACE FUNCTION public.get_supervisor_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT supervisor_id FROM public.profiles WHERE id = _user_id
$$;

-- ============================================
-- RLS POLICIES - USER ROLES
-- ============================================
CREATE POLICY "Anyone can view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Supervisors can view assigned workers" ON public.profiles
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'supervisor') AND supervisor_id = auth.uid()
  );

CREATE POLICY "Accountants can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_accountant(auth.uid()));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================
-- RLS POLICIES - BANK DETAILS
-- ============================================
CREATE POLICY "Users can view own bank details" ON public.bank_details
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all bank details" ON public.bank_details
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Accountants can view all bank details" ON public.bank_details
  FOR SELECT TO authenticated USING (public.is_accountant(auth.uid()));

CREATE POLICY "Supervisors can view assigned workers bank details" ON public.bank_details
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'supervisor') AND 
    public.is_supervisor_of(auth.uid(), user_id)
  );

CREATE POLICY "Users can manage own bank details" ON public.bank_details
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all bank details" ON public.bank_details
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================
-- RLS POLICIES - CONTRACTS
-- ============================================
CREATE POLICY "Workers can view own contracts" ON public.contracts
  FOR SELECT TO authenticated USING (worker_id = auth.uid());

CREATE POLICY "Admins can manage contracts" ON public.contracts
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Supervisors can view assigned workers contracts" ON public.contracts
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'supervisor') AND 
    public.is_supervisor_of(auth.uid(), worker_id)
  );

CREATE POLICY "Accountants can view contracts" ON public.contracts
  FOR SELECT TO authenticated USING (public.is_accountant(auth.uid()));

-- ============================================
-- RLS POLICIES - TIMESHEETS
-- ============================================
CREATE POLICY "Workers can view own timesheets" ON public.timesheets
  FOR SELECT TO authenticated USING (worker_id = auth.uid());

CREATE POLICY "Supervisors can manage their timesheets" ON public.timesheets
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'supervisor') AND supervisor_id = auth.uid()
  );

CREATE POLICY "Admins can manage all timesheets" ON public.timesheets
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Accountants can view timesheets" ON public.timesheets
  FOR SELECT TO authenticated USING (public.is_accountant(auth.uid()));

-- ============================================
-- RLS POLICIES - PAYSLIPS
-- ============================================
CREATE POLICY "Workers can view own payslips" ON public.payslips
  FOR SELECT TO authenticated USING (worker_id = auth.uid());

CREATE POLICY "Admins can manage all payslips" ON public.payslips
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Accountants can manage payslips" ON public.payslips
  FOR ALL TO authenticated USING (public.is_accountant(auth.uid()));

CREATE POLICY "Supervisors can view assigned workers payslips" ON public.payslips
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'supervisor') AND 
    public.is_supervisor_of(auth.uid(), worker_id)
  );

-- ============================================
-- RLS POLICIES - MESSAGES
-- ============================================
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT TO authenticated USING (
    sender_id = auth.uid() OR receiver_id = auth.uid() OR
    (is_broadcast = true AND broadcast_to_role IN (
      SELECT role FROM public.user_roles WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Admins can view all messages" ON public.messages
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================
-- RLS POLICIES - FINANCIAL TRANSACTIONS
-- ============================================
CREATE POLICY "Admins can manage transactions" ON public.financial_transactions
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Accountants can manage transactions" ON public.financial_transactions
  FOR ALL TO authenticated USING (public.is_accountant(auth.uid()));

CREATE POLICY "Supervisors can view transactions" ON public.financial_transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'supervisor'));

-- ============================================
-- RLS POLICIES - ACCOUNT APPROVALS
-- ============================================
CREATE POLICY "Users can view own approval" ON public.account_approvals
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create own approval" ON public.account_approvals
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage approvals" ON public.account_approvals
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Supervisors can manage approvals" ON public.account_approvals
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'supervisor'));

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.phone
  );
  
  -- Create default worker role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'worker');
  
  -- Create approval request
  INSERT INTO public.account_approvals (user_id, requested_role)
  VALUES (NEW.id, 'worker');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bank_details_updated_at
  BEFORE UPDATE ON public.bank_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_timesheets_updated_at
  BEFORE UPDATE ON public.timesheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payslips_updated_at
  BEFORE UPDATE ON public.payslips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-generate payslip from approved timesheet
CREATE OR REPLACE FUNCTION public.auto_generate_payslip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  worker_rate NUMERIC(10,2);
  period_s DATE;
  period_e DATE;
  existing_payslip_id UUID;
BEGIN
  -- Only trigger when timesheet is approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Get worker's hourly rate
    SELECT hourly_rate INTO worker_rate FROM public.profiles WHERE id = NEW.worker_id;
    
    -- Calculate pay period (bi-weekly: 1-15 and 16-end of month)
    IF EXTRACT(DAY FROM NEW.date) <= 15 THEN
      period_s := DATE_TRUNC('month', NEW.date)::DATE;
      period_e := (DATE_TRUNC('month', NEW.date) + INTERVAL '14 days')::DATE;
    ELSE
      period_s := (DATE_TRUNC('month', NEW.date) + INTERVAL '15 days')::DATE;
      period_e := (DATE_TRUNC('month', NEW.date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    END IF;
    
    -- Check if payslip already exists for this period
    SELECT id INTO existing_payslip_id 
    FROM public.payslips 
    WHERE worker_id = NEW.worker_id 
      AND period_start = period_s 
      AND period_end = period_e;
    
    IF existing_payslip_id IS NOT NULL THEN
      -- Update existing payslip with new totals
      UPDATE public.payslips
      SET total_hours = (
            SELECT COALESCE(SUM(total_hours), 0) 
            FROM public.timesheets 
            WHERE worker_id = NEW.worker_id 
              AND status = 'approved'
              AND date BETWEEN period_s AND period_e
          ),
          gross_pay = (
            SELECT COALESCE(SUM(total_hours), 0) * worker_rate
            FROM public.timesheets 
            WHERE worker_id = NEW.worker_id 
              AND status = 'approved'
              AND date BETWEEN period_s AND period_e
          ),
          net_pay = (
            SELECT COALESCE(SUM(total_hours), 0) * worker_rate
            FROM public.timesheets 
            WHERE worker_id = NEW.worker_id 
              AND status = 'approved'
              AND date BETWEEN period_s AND period_e
          ) - COALESCE(deductions, 0),
          hourly_rate = worker_rate,
          status = 'generated',
          updated_at = now()
      WHERE id = existing_payslip_id;
    ELSE
      -- Create new payslip
      INSERT INTO public.payslips (
        worker_id, period_start, period_end, total_hours, hourly_rate,
        gross_pay, net_pay, status, generated_by
      ) VALUES (
        NEW.worker_id,
        period_s,
        period_e,
        NEW.total_hours,
        worker_rate,
        NEW.total_hours * worker_rate,
        NEW.total_hours * worker_rate,
        'generated',
        NEW.approved_by
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_generate_payslip_trigger
  AFTER UPDATE ON public.timesheets
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_payslip();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_profiles_supervisor_id ON public.profiles(supervisor_id);
CREATE INDEX idx_timesheets_worker_id ON public.timesheets(worker_id);
CREATE INDEX idx_timesheets_supervisor_id ON public.timesheets(supervisor_id);
CREATE INDEX idx_timesheets_date ON public.timesheets(date);
CREATE INDEX idx_payslips_worker_id ON public.payslips(worker_id);
CREATE INDEX idx_payslips_period ON public.payslips(period_start, period_end);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_contracts_worker_id ON public.contracts(worker_id);
CREATE INDEX idx_financial_transactions_date ON public.financial_transactions(transaction_date);
CREATE INDEX idx_account_approvals_user_id ON public.account_approvals(user_id);
