import { useAuth } from "@/hooks/useAuth";
import { formatKina, generateAndStorePayslipPdf } from "@/lib/payroll-engine";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Download, Loader2 } from "lucide-react";
import { usePayslips } from "@/hooks/usePayslips";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export default function MyPayslips() {
  const { user } = useAuth();
  const { data: payslips, isLoading } = usePayslips();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: fullProfile } = useQuery({
    queryKey: ["my-full-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });

  const handleDownload = async (payslip: any) => {
    if (!fullProfile) return;
    setDownloadingId(payslip.id);
    try {
      const signedUrl = await generateAndStorePayslipPdf({ payslip, worker: fullProfile as any });
      window.open(signedUrl, "_blank");
    } catch (err: any) {
      toast.error("Failed to generate PDF: " + (err.message ?? "Unknown error"));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">My Payslips</h1>
        <p className="page-subtitle">Your payroll history — download PDF copies</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !payslips || payslips.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No payslips available yet</p>
            <p className="text-sm text-muted-foreground mt-1">Payslips appear after payroll is processed and approved</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.period_start} → {p.period_end}</TableCell>
                  <TableCell>{Number(p.total_hours ?? 0).toFixed(1)}h</TableCell>
                  <TableCell>{formatKina(Number(p.gross_pay))}</TableCell>
                  <TableCell className="text-destructive">{formatKina(Number(p.deductions))}</TableCell>
                  <TableCell className="font-semibold text-success">{formatKina(Number(p.net_pay))}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "paid" ? "default" : "secondary"} className="capitalize">{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      disabled={downloadingId === p.id || !fullProfile}
                      onClick={() => handleDownload(p)}
                    >
                      {downloadingId === p.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
