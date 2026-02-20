import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function usePayslipNotifications() {
  const { user } = useAuth();
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`payroll-entries-worker-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "payroll_entries",
          filter: `worker_id=eq.${user.id}`,
        },
        (payload) => {
          const id = String(payload.new.id);
          if (!seenIds.current.has(id)) {
            seenIds.current.add(id);
            toast.success("New payslip is ready", {
              description: "Your payroll entry has been generated and is available now.",
            });
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);
}
