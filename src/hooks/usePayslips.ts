import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mapErrorToUserMessage } from "@/lib/error-utils";

export function usePayslips(workerId?: string) {
  const { user, primaryRole } = useAuth();
  return useQuery({
    queryKey: ["payslips", workerId ?? user?.id, primaryRole],
    enabled: !!user?.id,
    queryFn: async () => {
      let query = supabase
        .from("payslips")
        .select("*")
        .order("created_at", { ascending: false });

      if (workerId) {
        query = query.eq("worker_id", workerId);
      } else if (primaryRole === "worker") {
        query = query.eq("worker_id", user!.id);
      }

      const { data, error } = await query;
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data ?? [];
    },
  });
}
