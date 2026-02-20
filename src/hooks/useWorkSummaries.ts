import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mapErrorToUserMessage } from "@/lib/error-utils";

const db = supabase as any;

export function useWorkSummaries(workerId?: string) {
  const { user } = useAuth();
  const id = workerId || user?.id;
  return useQuery({
    queryKey: ['work-summaries', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await db.from('work_summaries').select('*').eq('worker_id', id).order('period_end', { ascending: false });
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    enabled: !!id,
  });
}

export function useAllWorkSummaries() {
  return useQuery({
    queryKey: ['work-summaries-all'],
    queryFn: async () => {
      const { data, error } = await db.from('work_summaries').select('*').order('period_end', { ascending: false });
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
  });
}

export function useCreateWorkSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (summary: any) => {
      const { data, error } = await db.from('work_summaries').insert(summary).select().single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['work-summaries'] }); },
  });
}

export function useReviewWorkSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reviewedBy }: { id: string; status: string; reviewedBy: string }) => {
      const { data, error } = await db
        .from('work_summaries')
        .update({ status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-summaries'] });
      queryClient.invalidateQueries({ queryKey: ['work-summaries-all'] });
    },
  });
}

export function getCurrentFortnightPeriod(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (day <= 15) {
    return {
      start: new Date(year, month, 1).toISOString().split('T')[0],
      end: new Date(year, month, 15).toISOString().split('T')[0],
    };
  } else {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return {
      start: new Date(year, month, 16).toISOString().split('T')[0],
      end: new Date(year, month, lastDay).toISOString().split('T')[0],
    };
  }
}
