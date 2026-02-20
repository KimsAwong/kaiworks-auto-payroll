-- KaiaWorks Phase 1 RLS for attendance, payroll_entries, profiles, audit_log

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_worker_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_worker_insert" ON public.attendance;
DROP POLICY IF EXISTS "attendance_supervisor_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_supervisor_update" ON public.attendance;
DROP POLICY IF EXISTS "attendance_ceo_all" ON public.attendance;

CREATE POLICY "attendance_worker_select"
ON public.attendance
FOR SELECT
TO authenticated
USING (worker_id = auth.uid());

CREATE POLICY "attendance_worker_insert"
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (worker_id = auth.uid());

CREATE POLICY "attendance_supervisor_select"
ON public.attendance
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = attendance.worker_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'supervisor'
      AND p.supervisor_id = auth.uid()
  )
);

CREATE POLICY "attendance_supervisor_update"
ON public.attendance
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = attendance.worker_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'supervisor'
      AND p.supervisor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = attendance.worker_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'supervisor'
      AND p.supervisor_id = auth.uid()
  )
);

CREATE POLICY "attendance_ceo_all"
ON public.attendance
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'ceo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'ceo'
  )
);

DROP POLICY IF EXISTS "payroll_worker_select" ON public.payroll_entries;
DROP POLICY IF EXISTS "payroll_supervisor_select" ON public.payroll_entries;
DROP POLICY IF EXISTS "payroll_ceo_all" ON public.payroll_entries;

CREATE POLICY "payroll_worker_select"
ON public.payroll_entries
FOR SELECT
TO authenticated
USING (worker_id = auth.uid());

CREATE POLICY "payroll_supervisor_select"
ON public.payroll_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = payroll_entries.worker_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'supervisor'
      AND p.supervisor_id = auth.uid()
  )
);

CREATE POLICY "payroll_ceo_all"
ON public.payroll_entries
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'ceo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'ceo'
  )
);

DROP POLICY IF EXISTS "profiles_worker_select_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_supervisor_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_ceo_all" ON public.profiles;

CREATE POLICY "profiles_worker_select_update"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_worker_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_supervisor_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'supervisor'
      AND profiles.supervisor_id = auth.uid()
  )
);

CREATE POLICY "profiles_ceo_all"
ON public.profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'ceo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'ceo'
  )
);

DROP POLICY IF EXISTS "audit_ceo_read_insert" ON public.audit_log;
DROP POLICY IF EXISTS "audit_supervisor_insert" ON public.audit_log;

CREATE POLICY "audit_ceo_read_insert"
ON public.audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'ceo'
  )
);

CREATE POLICY "audit_insert_self"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
