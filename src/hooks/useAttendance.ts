import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { mapErrorToUserMessage } from "@/lib/error-utils";

const clockSchema = z.object({ worker_id: z.string().uuid() });
const clockOutSchema = z.object({ timesheet_id: z.string().uuid() });
const attendanceDecisionSchema = z.object({
  timesheet_id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  notes: z.string().max(1000).optional(),
});

export function useAttendance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["attendance", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheets")
        .select("*")
        .eq("worker_id", user!.id)
        .order("date", { ascending: false });
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data ?? [];
    },
  });
}

export function useTeamAttendance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["team-attendance", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheets")
        .select("*, worker:profiles!timesheets_worker_id_fkey(id, full_name)")
        .order("date", { ascending: false });
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data ?? [];
    },
  });
}

export function useClockIn() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const parsed = clockSchema.parse({ worker_id: user?.id });
      const now = new Date();
      const supervisorId = user?.supervisor_id;
      const { data, error } = await supabase
        .from("timesheets")
        .insert({
          worker_id: parsed.worker_id,
          supervisor_id: supervisorId ?? parsed.worker_id,
          clock_in: now.toTimeString().slice(0, 8),
          clock_out: now.toTimeString().slice(0, 8),
          date: now.toISOString().slice(0, 10),
          status: "pending" as const,
        })
        .select()
        .single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    onSuccess: () => {
      toast.success("Clock in recorded.");
      queryClient.invalidateQueries({ queryKey: ["attendance", user?.id] });
    },
    onError: (error: any) => toast.error(error.message ?? "Clock in failed"),
  });
}

export function useClockOut() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (timesheetId: string) => {
      const parsed = clockOutSchema.parse({ timesheet_id: timesheetId });
      const now = new Date();
      const { data, error } = await supabase
        .from("timesheets")
        .update({
          clock_out: now.toTimeString().slice(0, 8),
          status: "pending" as const,
        })
        .eq("id", parsed.timesheet_id)
        .eq("worker_id", user?.id ?? "")
        .select()
        .single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    onSuccess: () => {
      toast.success("Clock out recorded.");
      queryClient.invalidateQueries({ queryKey: ["attendance", user?.id] });
    },
    onError: (error: any) => toast.error(error.message ?? "Clock out failed"),
  });
}

export function useReviewAttendance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: z.infer<typeof attendanceDecisionSchema>) => {
      const parsed = attendanceDecisionSchema.parse(payload);
      const { data, error } = await supabase
        .from("timesheets")
        .update({
          status: parsed.status as any,
          notes: parsed.notes ?? null,
          approved_by: user?.id ?? null,
          approved_at: new Date().toISOString(),
        })
        .eq("id", parsed.timesheet_id)
        .select()
        .single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-attendance", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance updated.");
    },
    onError: (error: any) => toast.error(error.message ?? "Failed to update attendance"),
  });
}
