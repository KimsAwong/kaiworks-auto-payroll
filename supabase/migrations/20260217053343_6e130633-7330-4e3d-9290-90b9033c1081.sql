
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'hr', 'finance', 'employee');

-- User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Employees
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  tin TEXT,
  is_resident BOOLEAN DEFAULT true,
  base_salary DECIMAL(12,2) NOT NULL,
  department TEXT,
  position TEXT,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','terminated')),
  bank_details JSONB DEFAULT '{}',
  super_fund TEXT DEFAULT 'NASFUND',
  super_member_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  employee_id UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Payroll cycles
CREATE TABLE public.payroll_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','preview','approved','paid')),
  run_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  total_gross DECIMAL(12,2) DEFAULT 0,
  total_paye DECIMAL(12,2) DEFAULT 0,
  total_net DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payroll_cycles ENABLE ROW LEVEL SECURITY;

-- Payroll entries
CREATE TABLE public.payroll_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES public.payroll_cycles(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  base_pay DECIMAL(12,2) DEFAULT 0,
  overtime_hours DECIMAL(8,2) DEFAULT 0,
  overtime_pay DECIMAL(12,2) DEFAULT 0,
  allowances JSONB DEFAULT '[]',
  gross_earnings DECIMAL(12,2) DEFAULT 0,
  paye_tax DECIMAL(12,2) DEFAULT 0,
  employee_super DECIMAL(12,2) DEFAULT 0,
  employer_super DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  net_pay DECIMAL(12,2) DEFAULT 0,
  calculation_log JSONB DEFAULT '{}',
  payslip_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;

-- Tax brackets
CREATE TABLE public.tax_brackets (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL,
  brackets JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tax_brackets ENABLE ROW LEVEL SECURITY;

-- Seed 2026 tax brackets
INSERT INTO public.tax_brackets (version, brackets) VALUES 
('2026-resident', '[
  {"min": 0, "max": 20000, "rate": 0, "base": 0},
  {"min": 20001, "max": 33000, "rate": 0.30, "base": 0},
  {"min": 33001, "max": 70000, "rate": 0.35, "base": 3900},
  {"min": 70001, "max": 250000, "rate": 0.40, "base": 16850},
  {"min": 250001, "max": null, "rate": 0.42, "base": 88850}
]'),
('2026-nonresident', '[
  {"min": 0, "max": 20000, "rate": 0.22, "base": 0},
  {"min": 20001, "max": 33000, "rate": 0.30, "base": 4400},
  {"min": 33001, "max": 70000, "rate": 0.35, "base": 8300},
  {"min": 70001, "max": 250000, "rate": 0.40, "base": 21250},
  {"min": 250001, "max": null, "rate": 0.42, "base": 93250}
]');

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT,
  record_id UUID,
  action TEXT,
  changed_by UUID REFERENCES auth.users(id),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Security definer helper: has_role
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

-- Helper: is staff (admin, hr, or finance)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'hr', 'finance')
  )
$$;

-- Helper: get employee_id for user
CREATE OR REPLACE FUNCTION public.get_employee_id_for_user(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employees WHERE user_id = _user_id LIMIT 1
$$;

-- RLS: user_roles
CREATE POLICY "Staff can manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RLS: profiles
CREATE POLICY "Staff can manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- RLS: employees
CREATE POLICY "Staff can manage employees" ON public.employees FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "Employees can read own record" ON public.employees FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RLS: payroll_cycles
CREATE POLICY "Staff can manage payroll cycles" ON public.payroll_cycles FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()));

-- RLS: payroll_entries
CREATE POLICY "Staff can manage payroll entries" ON public.payroll_entries FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "Employees can read own entries" ON public.payroll_entries FOR SELECT TO authenticated
  USING (employee_id = public.get_employee_id_for_user(auth.uid()));

-- RLS: tax_brackets (public read)
CREATE POLICY "Anyone can read tax brackets" ON public.tax_brackets FOR SELECT TO authenticated
  USING (true);

-- RLS: messages
CREATE POLICY "Users can read own messages" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- RLS: audit_logs
CREATE POLICY "Admins can read audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_payroll_cycles_updated_at BEFORE UPDATE ON public.payroll_cycles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_payroll_entries_updated_at BEFORE UPDATE ON public.payroll_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
