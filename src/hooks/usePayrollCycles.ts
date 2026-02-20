import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mapErrorToUserMessage } from "@/lib/error-utils";

export interface PayrollCycle {
  id: string;
  period_start: string;
  period_end: string;
  status: 'draft' | 'verification' | 'pending_approval' | 'approved' | 'paid';
  total_workers: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  notes: string | null;
  created_by: string | null;
  verified_by: string | null;
  verified_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  paid_by: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export function usePayrollCycles() {
  return useQuery({
    queryKey: ["payroll-cycles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_cycles" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(mapErrorToUserMessage(error));
      return (data ?? []) as unknown as PayrollCycle[];
    },
  });
}

export function useCreatePayrollCycle() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ periodStart, periodEnd }: { periodStart: string; periodEnd: string }) => {
      const { data, error } = await supabase
        .from("payroll_cycles" as any)
        .insert({
          period_start: periodStart,
          period_end: periodEnd,
          status: 'draft',
          created_by: user?.id,
        } as any)
        .select()
        .single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data as unknown as PayrollCycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-cycles"] });
    },
  });
}

export function useUpdateCycleStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      cycleId, 
      status, 
      totals 
    }: { 
      cycleId: string; 
      status: PayrollCycle['status'];
      totals?: { total_workers: number; total_gross: number; total_deductions: number; total_net: number };
    }) => {
      const updateData: any = { status };
      
      if (status === 'verification') {
        updateData.verified_by = user?.id;
        updateData.verified_at = new Date().toISOString();
      } else if (status === 'approved') {
        updateData.approved_by = user?.id;
        updateData.approved_at = new Date().toISOString();
      } else if (status === 'paid') {
        updateData.paid_by = user?.id;
        updateData.paid_at = new Date().toISOString();
      }

      if (totals) {
        Object.assign(updateData, totals);
      }

      const { data, error } = await supabase
        .from("payroll_cycles" as any)
        .update(updateData)
        .eq("id", cycleId)
        .select()
        .single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data as unknown as PayrollCycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-cycles"] });
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
    },
  });
}
