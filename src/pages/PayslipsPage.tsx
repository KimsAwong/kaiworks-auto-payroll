import { useAuth } from "@/contexts/AuthContext";
import { usePayslips } from "@/hooks/usePayslips";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Receipt } from "lucide-react";
import { formatKina, generateAndStorePayslipPdf } from "@/lib/payroll-engine";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export default function PayslipsPage() {
  const { user } = useAuth();
  const { data: entries, isLoading } = usePayslips();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch worker profile for PDF generation
  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });

  const handleDownload = async (payslip: any) => {
    if (!profile) return;
    setDownloadingId(payslip.id);
    try {
      const signedUrl = await generateAndStorePayslipPdf({ payslip, worker: profile as any });
      window.open(signedUrl, "_blank");
    } catch (err: any) {
      toast.error("Failed to generate PDF: " + (err.message ?? "Unknown error"));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">My Payslips</h1>
        <p className="text-sm text-muted-foreground">Generated payroll statements.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payslip History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && entries.length === 0 && (
            <div className="py-8 text-sm text-muted-foreground">No payslips available yet.</div>
          )}

          {!isLoading && entries.length > 0 && (
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
                {entries.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.period_start} to {entry.period_end}
                    </TableCell>
                    <TableCell>K {Number(entry.gross_pay ?? 0).toFixed(2)}</TableCell>
                    <TableCell>K {Number(entry.deductions ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="font-medium">K {Number(entry.net_pay ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={entry.status === "paid" ? "default" : "secondary"}>{entry.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
