import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatKina } from "@/lib/payroll-engine";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Payslip = Tables<"payslips">;

export default function MyPayslips() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("payslips")
      .select("*")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setPayslips(data);
      });
  }, [user]);

  // Realtime subscription for instant payslip notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('my-payslips')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'payslips',
        filter: `worker_id=eq.${user.id}`,
      }, (payload) => {
        setPayslips((prev) => [payload.new as Payslip, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">My Payslips</h1>
        <p className="page-subtitle">Your payroll history</p>
      </div>

      {payslips.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No payslips available yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.period_start} → {p.period_end}</TableCell>
                  <TableCell>{formatKina(Number(p.gross_pay))}</TableCell>
                  <TableCell className="text-destructive">{formatKina(Number(p.deductions))}</TableCell>
                  <TableCell className="font-semibold">{formatKina(Number(p.net_pay))}</TableCell>
                  <TableCell><Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
