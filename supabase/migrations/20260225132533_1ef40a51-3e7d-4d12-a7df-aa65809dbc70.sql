-- Remove auto-payslip trigger so timesheets are just stored on approval
-- Payslips are now generated exclusively via the Payroll Wizard
DROP TRIGGER IF EXISTS auto_generate_payslip_trigger ON public.timesheets;
DROP FUNCTION IF EXISTS public.auto_generate_payslip();