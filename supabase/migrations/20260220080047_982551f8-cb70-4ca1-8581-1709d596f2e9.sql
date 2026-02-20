
-- 1. Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage projects" ON public.projects FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Supervisors can view projects" ON public.projects FOR SELECT USING (has_role(auth.uid(), 'supervisor'::app_role));
CREATE POLICY "Clerks can view projects" ON public.projects FOR SELECT USING (has_role(auth.uid(), 'clerk'::app_role));
CREATE POLICY "Payroll officers can view projects" ON public.projects FOR SELECT USING (is_payroll_officer(auth.uid()));

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2. Create project_assignments table
CREATE TABLE IF NOT EXISTS public.project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'supervisor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage assignments" ON public.project_assignments FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view own assignments" ON public.project_assignments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Clerks can view all assignments" ON public.project_assignments FOR SELECT USING (has_role(auth.uid(), 'clerk'::app_role));
CREATE POLICY "Payroll can view assignments" ON public.project_assignments FOR SELECT USING (is_payroll_officer(auth.uid()));

-- 3. Create site_timesheets table
CREATE TABLE IF NOT EXISTS public.site_timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  foreman_id UUID NOT NULL,
  clerk_id UUID,
  date DATE NOT NULL,
  shift TEXT,
  number_of_workers INTEGER NOT NULL DEFAULT 0,
  equipment JSONB NOT NULL DEFAULT '[]'::jsonb,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  production JSONB NOT NULL DEFAULT '[]'::jsonb,
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  rejection_reason TEXT,
  authorized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_timesheets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.validate_site_timesheet_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('draft', 'submitted', 'authorized', 'rejected') THEN
    RAISE EXCEPTION 'Invalid site timesheet status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_site_timesheet_status_trigger
  BEFORE INSERT OR UPDATE ON public.site_timesheets
  FOR EACH ROW EXECUTE FUNCTION public.validate_site_timesheet_status();

CREATE TRIGGER update_site_timesheets_updated_at BEFORE UPDATE ON public.site_timesheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS policies for site_timesheets
CREATE POLICY "Admins can manage site timesheets" ON public.site_timesheets FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Supervisors can manage own site timesheets" ON public.site_timesheets FOR ALL
  USING (foreman_id = auth.uid() AND has_role(auth.uid(), 'supervisor'::app_role))
  WITH CHECK (foreman_id = auth.uid() AND has_role(auth.uid(), 'supervisor'::app_role));
CREATE POLICY "Clerks can view all site timesheets" ON public.site_timesheets FOR SELECT USING (has_role(auth.uid(), 'clerk'::app_role));
CREATE POLICY "Clerks can update site timesheets" ON public.site_timesheets FOR UPDATE USING (has_role(auth.uid(), 'clerk'::app_role));
CREATE POLICY "Clerks can insert site timesheets" ON public.site_timesheets FOR INSERT WITH CHECK (has_role(auth.uid(), 'clerk'::app_role));
CREATE POLICY "Payroll officers can view site timesheets" ON public.site_timesheets FOR SELECT USING (is_payroll_officer(auth.uid()));

-- Helper function
CREATE OR REPLACE FUNCTION public.is_clerk(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'clerk'
  )
$$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE site_timesheets;

-- Seed projects
INSERT INTO public.projects (id, name, location, status) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Lae Highway Extension', 'Lae, Morobe Province', 'active'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Port Moresby Office Complex', 'Boroko, NCD', 'active'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Goroka Water Treatment Plant', 'Goroka, Eastern Highlands', 'on-hold');
