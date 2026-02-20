
-- Messages table is already in supabase_realtime, just need to verify
-- Also enable realtime for timesheets so dashboard updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.timesheets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payslips;
