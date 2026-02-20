import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mapErrorToUserMessage } from "@/lib/error-utils";

const db = supabase as any;

export function useContracts(workerId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contracts', workerId],
    queryFn: async () => {
      let query = db.from('contracts').select('*').order('start_date', { ascending: false });
      if (workerId) query = query.eq('worker_id', workerId);
      const { data, error } = await query;
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contract: any) => {
      const { data, error } = await db.from('contracts').insert(contract).select().single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contracts'] }); },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await db.from('contracts').update(updates).eq('id', id).select().single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contracts'] }); },
  });
}

export function useDeactivateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('contracts').update({ is_active: false }).eq('id', id);
      if (error) throw new Error(mapErrorToUserMessage(error));
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contracts'] }); },
  });
}
