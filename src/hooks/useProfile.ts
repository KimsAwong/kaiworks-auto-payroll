import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mapErrorToUserMessage } from "@/lib/error-utils";

const db = supabase as any;

export function useProfile(userId?: string) {
  const { user } = useAuth();
  const id = userId || user?.id;
  return useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await db.from('profiles').select('*').eq('id', id).single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await db.from('profiles').update(updates).eq('id', id).select().single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['profile', data.id] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await db.from('profiles').select('*').order('full_name');
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
  });
}

export function useBankDetails(userId?: string) {
  const { user } = useAuth();
  const id = userId || user?.id;
  return useQuery({
    queryKey: ['bank-details', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await db.from('bank_details').select('*').eq('user_id', id).maybeSingle();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    enabled: !!id,
  });
}

export function useUpsertBankDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, details }: { userId: string; details: Record<string, any> }) => {
      const { data, error } = await db
        .from('bank_details')
        .upsert({ user_id: userId, ...details }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    onSuccess: (_: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['bank-details', variables.userId] });
    },
  });
}
