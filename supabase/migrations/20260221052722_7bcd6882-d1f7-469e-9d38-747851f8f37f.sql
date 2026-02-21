
-- Allow clerks to view all regular worker timesheets
CREATE POLICY "Clerks can view all timesheets"
ON public.timesheets
FOR SELECT
USING (has_role(auth.uid(), 'clerk'::app_role));

-- Allow clerks to update regular worker timesheets (approve/reject)
CREATE POLICY "Clerks can update timesheets"
ON public.timesheets
FOR UPDATE
USING (has_role(auth.uid(), 'clerk'::app_role));
