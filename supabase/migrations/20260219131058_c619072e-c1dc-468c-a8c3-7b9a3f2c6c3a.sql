
-- Fix profiles RLS: Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Accountants can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Payroll officers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Supervisors can view assigned workers" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Prevent deleting admin or self profiles" ON public.profiles;

-- Recreate as PERMISSIVE
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Accountants can view all profiles" ON public.profiles FOR SELECT USING (is_accountant(auth.uid()));
CREATE POLICY "Payroll officers can view all profiles" ON public.profiles FOR SELECT USING (is_payroll_officer(auth.uid()));
CREATE POLICY "Supervisors can view assigned workers" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'supervisor'::app_role) AND supervisor_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Prevent deleting admin or self profiles" ON public.profiles FOR DELETE USING (id <> auth.uid() AND NOT is_admin(id));

-- Fix payroll_cycles RLS
DROP POLICY IF EXISTS "Admins can manage payroll cycles" ON public.payroll_cycles;
DROP POLICY IF EXISTS "Finance can manage payroll cycles" ON public.payroll_cycles;
DROP POLICY IF EXISTS "Supervisors can view payroll cycles" ON public.payroll_cycles;

CREATE POLICY "Admins can manage payroll cycles" ON public.payroll_cycles FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Finance can manage payroll cycles" ON public.payroll_cycles FOR ALL USING (is_finance(auth.uid()));
CREATE POLICY "Supervisors can view payroll cycles" ON public.payroll_cycles FOR SELECT USING (has_role(auth.uid(), 'supervisor'::app_role));

-- Fix payslips RLS
DROP POLICY IF EXISTS "Admins can manage all payslips" ON public.payslips;
DROP POLICY IF EXISTS "Accountants can manage payslips" ON public.payslips;
DROP POLICY IF EXISTS "Payroll officers can manage payslips" ON public.payslips;
DROP POLICY IF EXISTS "Supervisors can view assigned workers payslips" ON public.payslips;
DROP POLICY IF EXISTS "Workers can view own payslips" ON public.payslips;

CREATE POLICY "Admins can manage all payslips" ON public.payslips FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Accountants can manage payslips" ON public.payslips FOR ALL USING (is_accountant(auth.uid()));
CREATE POLICY "Payroll officers can manage payslips" ON public.payslips FOR ALL USING (is_payroll_officer(auth.uid()));
CREATE POLICY "Supervisors can view assigned workers payslips" ON public.payslips FOR SELECT USING (has_role(auth.uid(), 'supervisor'::app_role) AND is_supervisor_of(auth.uid(), worker_id));
CREATE POLICY "Workers can view own payslips" ON public.payslips FOR SELECT USING (worker_id = auth.uid());

-- Fix timesheets RLS
DROP POLICY IF EXISTS "Admins can manage all timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Accountants can view timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Payroll officers can view all timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Supervisors can manage their timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Workers can view own timesheets" ON public.timesheets;

CREATE POLICY "Admins can manage all timesheets" ON public.timesheets FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Accountants can view timesheets" ON public.timesheets FOR SELECT USING (is_accountant(auth.uid()));
CREATE POLICY "Payroll officers can view all timesheets" ON public.timesheets FOR SELECT USING (is_payroll_officer(auth.uid()));
CREATE POLICY "Supervisors can manage their timesheets" ON public.timesheets FOR ALL USING (has_role(auth.uid(), 'supervisor'::app_role) AND supervisor_id = auth.uid());
CREATE POLICY "Workers can view own timesheets" ON public.timesheets FOR SELECT USING (worker_id = auth.uid());

-- Fix other tables too
DROP POLICY IF EXISTS "Admins can manage approvals" ON public.account_approvals;
DROP POLICY IF EXISTS "Supervisors can manage approvals" ON public.account_approvals;
DROP POLICY IF EXISTS "Users can create own approval" ON public.account_approvals;
DROP POLICY IF EXISTS "Users can view own approval" ON public.account_approvals;

CREATE POLICY "Admins can manage approvals" ON public.account_approvals FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Supervisors can manage approvals" ON public.account_approvals FOR ALL USING (has_role(auth.uid(), 'supervisor'::app_role));
CREATE POLICY "Users can create own approval" ON public.account_approvals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own approval" ON public.account_approvals FOR SELECT USING (user_id = auth.uid());

-- Fix user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view roles" ON public.user_roles FOR SELECT USING (true);

-- Fix messages
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Fix bank_details
DROP POLICY IF EXISTS "Admins can manage all bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Admins can view all bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Accountants can view all bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Supervisors can view assigned workers bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Users can manage own bank details" ON public.bank_details;
DROP POLICY IF EXISTS "Users can view own bank details" ON public.bank_details;

CREATE POLICY "Admins can manage all bank details" ON public.bank_details FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Accountants can view all bank details" ON public.bank_details FOR SELECT USING (is_accountant(auth.uid()));
CREATE POLICY "Supervisors can view assigned workers bank details" ON public.bank_details FOR SELECT USING (has_role(auth.uid(), 'supervisor'::app_role) AND is_supervisor_of(auth.uid(), user_id));
CREATE POLICY "Users can manage own bank details" ON public.bank_details FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Fix contracts
DROP POLICY IF EXISTS "Admins can manage contracts" ON public.contracts;
DROP POLICY IF EXISTS "Accountants can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Supervisors can view assigned workers contracts" ON public.contracts;
DROP POLICY IF EXISTS "Workers can view own contracts" ON public.contracts;

CREATE POLICY "Admins can manage contracts" ON public.contracts FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Accountants can view contracts" ON public.contracts FOR SELECT USING (is_accountant(auth.uid()));
CREATE POLICY "Supervisors can view assigned workers contracts" ON public.contracts FOR SELECT USING (has_role(auth.uid(), 'supervisor'::app_role) AND is_supervisor_of(auth.uid(), worker_id));
CREATE POLICY "Workers can view own contracts" ON public.contracts FOR SELECT USING (worker_id = auth.uid());

-- Fix financial_transactions
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Accountants can manage transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Supervisors can view transactions" ON public.financial_transactions;

CREATE POLICY "Admins can manage transactions" ON public.financial_transactions FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Accountants can manage transactions" ON public.financial_transactions FOR ALL USING (is_accountant(auth.uid()));
CREATE POLICY "Supervisors can view transactions" ON public.financial_transactions FOR SELECT USING (has_role(auth.uid(), 'supervisor'::app_role));

-- Fix work_summaries
DROP POLICY IF EXISTS "Admins can manage all summaries" ON public.work_summaries;
DROP POLICY IF EXISTS "Supervisors can update assigned workers summaries" ON public.work_summaries;
DROP POLICY IF EXISTS "Supervisors can view assigned workers summaries" ON public.work_summaries;
DROP POLICY IF EXISTS "Workers can create own summaries" ON public.work_summaries;
DROP POLICY IF EXISTS "Workers can view own summaries" ON public.work_summaries;

CREATE POLICY "Admins can manage all summaries" ON public.work_summaries FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Supervisors can update assigned workers summaries" ON public.work_summaries FOR UPDATE USING (has_role(auth.uid(), 'supervisor'::app_role) AND is_supervisor_of(auth.uid(), worker_id));
CREATE POLICY "Supervisors can view assigned workers summaries" ON public.work_summaries FOR SELECT USING (has_role(auth.uid(), 'supervisor'::app_role) AND is_supervisor_of(auth.uid(), worker_id));
CREATE POLICY "Workers can create own summaries" ON public.work_summaries FOR INSERT WITH CHECK (worker_id = auth.uid());
CREATE POLICY "Workers can view own summaries" ON public.work_summaries FOR SELECT USING (worker_id = auth.uid());
