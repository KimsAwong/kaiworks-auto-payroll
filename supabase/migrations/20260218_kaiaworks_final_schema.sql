-- KaiaWorks Phase 1 schema normalization helpers

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS worker_type TEXT CHECK (worker_type IN ('permanent', 'temporary')),
  ADD COLUMN IF NOT EXISTS base_salary NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS is_resident BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS super_enabled BOOLEAN DEFAULT TRUE;

UPDATE public.profiles
SET worker_type = COALESCE(worker_type, employment_type::TEXT, 'permanent');

CREATE INDEX IF NOT EXISTS idx_profiles_supervisor_id ON public.profiles(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_profiles_worker_type ON public.profiles(worker_type);

CREATE INDEX IF NOT EXISTS idx_attendance_worker_id ON public.attendance(worker_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_clock_in ON public.attendance(clock_in);

CREATE INDEX IF NOT EXISTS idx_payroll_entries_worker_id ON public.payroll_entries(worker_id);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_period ON public.payroll_entries(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_status ON public.payroll_entries(status);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
