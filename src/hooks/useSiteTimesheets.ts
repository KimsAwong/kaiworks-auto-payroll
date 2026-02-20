import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mapErrorToUserMessage } from "@/lib/error-utils";
import { useEffect } from "react";

const db = supabase as any;

export interface SiteTimesheetInput {
  project_id: string;
  foreman_id: string;
  date: string;
  shift?: string;
  number_of_workers: number;
  equipment: any[];
  materials: any[];
  production: any[];
  remarks?: string;
  status?: string;
}

export function useSiteTimesheets(filters?: { projectId?: string; status?: string; foremanId?: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('site-timesheets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_timesheets' }, () => {
        queryClient.invalidateQueries({ queryKey: ['site-timesheets'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ['site-timesheets', filters],
    queryFn: async () => {
      let query = db
        .from('site_timesheets')
        .select('*, project:projects(name, location), foreman:profiles!site_timesheets_foreman_id_fkey(full_name, position)')
        .order('date', { ascending: false });
      
      if (filters?.projectId) query = query.eq('project_id', filters.projectId);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.foremanId) query = query.eq('foreman_id', filters.foremanId);

      const { data, error } = await query;
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data as any[];
    },
    enabled: !!user,
  });
}

export function useCreateSiteTimesheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: SiteTimesheetInput) => {
      const { data, error } = await db.from('site_timesheets').insert(entry).select().single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['site-timesheets'] }); },
  });
}

export function useUpdateSiteTimesheetStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, clerkId, rejectionReason }: { id: string; status: string; clerkId?: string; rejectionReason?: string }) => {
      const updates: Record<string, any> = { status };
      if (status === 'authorized' && clerkId) {
        updates.clerk_id = clerkId;
        updates.authorized_at = new Date().toISOString();
      }
      if (status === 'rejected' && rejectionReason) {
        updates.rejection_reason = rejectionReason;
        if (clerkId) updates.clerk_id = clerkId;
      }
      const { data, error } = await db.from('site_timesheets').update(updates).eq('id', id).select().single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['site-timesheets'] }); },
  });
}
