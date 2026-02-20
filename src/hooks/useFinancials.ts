import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapErrorToUserMessage } from "@/lib/error-utils";

export function useFinancialTransactions() {
  return useQuery({
    queryKey: ['financial-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transaction: any) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([transaction])
        .select()
        .single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
    },
  });
}

export function useFinancialSummary() {
  return useQuery({
    queryKey: ['financial-summary'],
    queryFn: async () => {
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select('transaction_type, amount, transaction_date');
      if (error) throw new Error(mapErrorToUserMessage(error));

      const { data: payslips } = await supabase
        .from('payslips')
        .select('status, gross_pay, net_pay, deductions');

      const totalPayroll = payslips?.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.net_pay), 0) || 0;
      const pendingPayroll = payslips?.filter((p) => p.status === 'generated').reduce((sum, p) => sum + Number(p.net_pay), 0) || 0;
      const totalExpenses = transactions?.filter((t) => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalDeductions = payslips?.reduce((sum, p) => sum + Number(p.deductions || 0), 0) || 0;

      return { totalPayroll, pendingPayroll, totalExpenses, totalDeductions };
    },
  });
}
