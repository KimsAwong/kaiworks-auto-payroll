import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mapErrorToUserMessage } from "@/lib/error-utils";

const db = supabase as any;

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['account-approvals'],
    queryFn: async () => {
      const { data: approvals, error } = await db
        .from('account_approvals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw new Error(mapErrorToUserMessage(error));
      if (!approvals || approvals.length === 0) return [];

      const userIds = approvals.map((a: any) => a.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      return approvals.map((a: any) => ({
        ...a,
        user: profiles?.find((p: any) => p.id === a.user_id) || null,
      }));
    },
  });
}

export function useApproveAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ approvalId, userId, status }: { approvalId: string; userId: string; status: 'approved' | 'rejected' }) => {
      const { error: approvalError } = await db
        .from('account_approvals')
        .update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', approvalId);
      if (approvalError) throw new Error(mapErrorToUserMessage(approvalError));

      const { error: profileError } = await db
        .from('profiles')
        .update({ account_status: status })
        .eq('id', userId);
      if (profileError) throw new Error(mapErrorToUserMessage(profileError));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}
