import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { mapErrorToUserMessage } from "@/lib/error-utils";

export function usePayrollEntries() {
  const { user, primaryRole } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["payroll-entries", user?.id, primaryRole],
    enabled: !!user?.id,
    queryFn: async () => {
      let queryBuilder = supabase
        .from("payslips")
        .select("*")
        .order("created_at", { ascending: false });

      if (primaryRole === "worker") {
        queryBuilder = queryBuilder.eq("worker_id", user!.id);
      }

      const { data, error } = await queryBuilder;
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data ?? [];
    },
  });

  // Realtime subscription for payslip updates
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`payslips-realtime-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "payslips",
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["payroll-entries"] });
        if (payload.eventType === "INSERT" && primaryRole === "worker") {
          const newPayslip = payload.new as any;
          if (newPayslip.worker_id === user.id) {
            toast.success("Your payslip is ready! 🎉");
          }
        }
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [user?.id, queryClient, primaryRole]);

  return query;
}
