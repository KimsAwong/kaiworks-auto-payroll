import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapErrorToUserMessage } from "@/lib/error-utils";

export function useWorkforceStats() {
  return useQuery({
    queryKey: ['workforce-stats'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, employment_type, account_status, department, hourly_rate, is_active');
      if (error) throw new Error(mapErrorToUserMessage(error));

      const activeWorkers = profiles?.filter((p) => p.account_status === 'approved' && p.is_active) || [];
      const totalWorkforce = activeWorkers.length;
      const permanent = activeWorkers.filter((p) => p.employment_type === 'permanent').length;
      const temporary = activeWorkers.filter((p) => p.employment_type === 'temporary').length;

      return { totalWorkforce, permanent, temporary, profiles: activeWorkers };
    },
  });
}

export function usePayrollStats() {
  return useQuery({
    queryKey: ['payroll-stats'],
    queryFn: async () => {
      const { data: payslips, error } = await supabase
        .from('payslips')
        .select('status, gross_pay, net_pay, deductions, period_start, period_end, created_at')
        .order('period_end', { ascending: false });
      if (error) throw new Error(mapErrorToUserMessage(error));

      const paid = payslips?.filter((p) => p.status === 'paid') || [];
      const generated = payslips?.filter((p) => p.status === 'generated') || [];

      const totalPayrollPaid = paid.reduce((sum, p) => sum + Number(p.net_pay), 0);
      const pendingPayroll = generated.reduce((sum, p) => sum + Number(p.net_pay), 0);
      const totalDeductions = payslips?.reduce((sum, p) => sum + Number(p.deductions || 0), 0) || 0;

      const monthlyMap = new Map<string, number>();
      payslips?.forEach((p) => {
        if (!p.period_end) return;
        const month = new Date(p.period_end).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + Number(p.gross_pay || 0));
      });
      const monthlyPayroll = Array.from(monthlyMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .slice(0, 6)
        .reverse();

      return { totalPayrollPaid, pendingPayroll, totalDeductions, monthlyPayroll };
    },
  });
}

export function useTimesheetStats() {
  return useQuery({
    queryKey: ['timesheet-stats'],
    queryFn: async () => {
      const { data: timesheets, error } = await supabase
        .from('timesheets')
        .select('date, total_hours, status, worker_id, created_at')
        .order('date', { ascending: false });
      if (error) throw new Error(mapErrorToUserMessage(error));

      const approved = timesheets?.filter((t) => t.status === 'approved') || [];
      const pending = timesheets?.filter((t) => t.status === 'pending') || [];
      const totalEntries = timesheets?.length || 0;

      const now = new Date();
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      const recentTimesheets = timesheets?.filter((t) => new Date(t.date) >= fourWeeksAgo) || [];

      const weeklyAttendance: { week: string; rate: number }[] = [];
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekEntries = recentTimesheets.filter((t) => {
          const d = new Date(t.date);
          return d >= weekStart && d < weekEnd;
        });
        const approvedCount = weekEntries.filter((t) => t.status === 'approved').length;
        const total = weekEntries.length || 1;
        weeklyAttendance.unshift({ week: `W${4 - i}`, rate: Math.round((approvedCount / total) * 100) });
      }

      const totalApprovedHours = approved.reduce((sum, t) => sum + Number(t.total_hours || 0), 0);

      return { totalEntries, pendingCount: pending.length, totalApprovedHours, weeklyAttendance };
    },
  });
}

export function useContractAlerts() {
  return useQuery({
    queryKey: ['contract-alerts'],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('is_active', true)
        .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('end_date', { ascending: true });
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data || [];
    },
  });
}
