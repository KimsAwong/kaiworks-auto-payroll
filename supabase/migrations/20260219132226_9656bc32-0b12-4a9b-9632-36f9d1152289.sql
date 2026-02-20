
-- Add CHECK constraints to payslips table to enforce data integrity at DB level
ALTER TABLE public.payslips ADD CONSTRAINT payslips_amounts_non_negative
  CHECK (gross_pay >= 0 AND net_pay >= 0 AND deductions >= 0 AND total_hours >= 0 AND hourly_rate >= 0);

-- Ensure net_pay = gross_pay - deductions (with small rounding tolerance)
ALTER TABLE public.payslips ADD CONSTRAINT payslips_net_calculation
  CHECK (ABS(net_pay - (gross_pay - deductions)) < 0.02);

-- Add reasonable upper bounds to prevent obviously fraudulent values
ALTER TABLE public.payslips ADD CONSTRAINT payslips_reasonable_bounds
  CHECK (hourly_rate <= 10000 AND total_hours <= 744 AND gross_pay <= 7440000);
