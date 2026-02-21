
-- 1. Add message content length constraint
ALTER TABLE public.messages ADD CONSTRAINT message_content_length CHECK (length(content) <= 5000);

-- 2. Restrict user_roles SELECT policy to own roles + admins + supervisors
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (
  user_id = auth.uid() OR is_admin(auth.uid()) OR (has_role(auth.uid(), 'supervisor'::app_role) AND is_supervisor_of(auth.uid(), user_id))
);

-- 3. Change CASCADE to RESTRICT/SET NULL on critical financial tables
-- Payslips: prevent deletion of profiles that have payslips
ALTER TABLE public.payslips DROP CONSTRAINT IF EXISTS payslips_worker_id_fkey;
ALTER TABLE public.payslips ADD CONSTRAINT payslips_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- Financial transactions: set null on worker reference
ALTER TABLE public.financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_related_worker_id_fkey;
ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_transactions_related_worker_id_fkey FOREIGN KEY (related_worker_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Timesheets: prevent deletion of profiles that have timesheets
ALTER TABLE public.timesheets DROP CONSTRAINT IF EXISTS timesheets_worker_id_fkey;
ALTER TABLE public.timesheets ADD CONSTRAINT timesheets_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
