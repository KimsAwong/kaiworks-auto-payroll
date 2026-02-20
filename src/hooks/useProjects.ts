import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mapErrorToUserMessage } from "@/lib/error-utils";

const db = supabase as any;

export function useProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await db.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data as any[];
    },
    enabled: !!user,
  });
}

export function useProjectAssignments(projectId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['project-assignments', projectId],
    queryFn: async () => {
      let query = db.from('project_assignments').select('*, project:projects(name, location)');
      if (projectId) query = query.eq('project_id', projectId);
      const { data, error } = await query;
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data as any[];
    },
    enabled: !!user,
  });
}

export function useMyProjectAssignments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-project-assignments', user?.id],
    queryFn: async () => {
      const { data, error } = await db
        .from('project_assignments')
        .select('*, project:projects(*)')
        .eq('user_id', user!.id);
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data as any[];
    },
    enabled: !!user,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (project: { name: string; location?: string; status?: string }) => {
      const { data, error } = await db.from('projects').insert(project).select().single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); },
  });
}

export function useAssignToProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, userId, role = 'supervisor' }: { projectId: string; userId: string; role?: string }) => {
      const { data, error } = await db.from('project_assignments').insert({
        project_id: projectId,
        user_id: userId,
        role,
      }).select().single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-project-assignments'] });
    },
  });
}
