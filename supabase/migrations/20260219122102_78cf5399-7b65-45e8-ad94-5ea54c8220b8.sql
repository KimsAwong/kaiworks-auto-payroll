
-- Fix 1: Improve timesheet hours calculation with validation
CREATE OR REPLACE FUNCTION public.calc_timesheet_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_hours NUMERIC(8,2);
BEGIN
  IF NEW.clock_in IS NOT NULL AND NEW.clock_out IS NOT NULL THEN
    v_hours := ROUND(
      EXTRACT(EPOCH FROM (NEW.clock_out::time - NEW.clock_in::time)) / 3600.0, 2
    );
    
    -- Handle overnight shifts (negative means crosses midnight)
    IF v_hours < 0 THEN
      v_hours := v_hours + 24;
    END IF;
    
    -- Validate reasonable range
    IF v_hours > 24 THEN
      RAISE EXCEPTION 'Total hours cannot exceed 24 hours per shift';
    END IF;
    
    IF v_hours < 0.1 THEN
      RAISE EXCEPTION 'Shift duration too short (minimum 6 minutes)';
    END IF;
    
    NEW.total_hours := v_hours;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix 2: Replace broad admin delete with safeguarded policy
-- Drop the existing ALL policy for admins on profiles (it covers DELETE too broadly)
-- We can't easily split an ALL policy, so we add a restrictive DELETE policy
-- Since RLS uses RESTRICTIVE policies (Permissive: No), the ALL policy already requires is_admin.
-- We add a specific DELETE restriction to prevent admins from deleting other admins or themselves.

CREATE POLICY "Prevent deleting admin or self profiles"
ON public.profiles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (
  id != auth.uid() AND
  NOT public.is_admin(id)
);

-- Fix 3: Add constraint to enforce broadcast message consistency
ALTER TABLE public.messages
ADD CONSTRAINT check_broadcast_consistency
CHECK (
  (is_broadcast = false AND receiver_id IS NOT NULL) OR
  (is_broadcast = true AND receiver_id IS NULL AND broadcast_to_role IS NOT NULL)
);
