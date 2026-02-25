import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Calculator, CheckCircle, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calculateWorkerPayroll, formatKina } from "@/lib/payroll-engine";
import { toast } from "sonner";

const db = supabase as any;

interface PayrollPreviewRow {
  worker: any;
  timesheets: any[];
  result: ReturnType<typeof calculateWorkerPayroll>;
}

export default function PayrollReadyTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<PayrollPreviewRow[] | null>(null);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  // Fetch clerk-verified timesheets
  const { data: verifiedTimesheets, isLoading } = useQuery({
    queryKey: ["clerk-verified-timesheets"],
    queryFn: async () => {
      const { data, error } = await db
        .from("timesheets")
        .select("*, worker:profiles!timesheets_worker_id_fkey(id, full_name, hourly_rate, employment_type, is_resident, super_enabled, position, employee_id)")
        .in("status", ["clerk_verified", "approved"])
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Group timesheets by worker
  const groupedByWorker = verifiedTimesheets?.reduce((acc: Record<string, { worker: any; timesheets: any[] }>, ts: any) => {
    const wId = ts.worker_id;
    if (!acc[wId]) acc[wId] = { worker: ts.worker, timesheets: [] };
    acc[wId].timesheets.push(ts);
    return acc;
  }, {} as Record<string, any>) || {};

  const workerCount = Object.keys(groupedByWorker).length;

  const handleRunPayroll = () => {
    if (!periodStart || !periodEnd) {
      toast.error("Please select pay period dates");
      return;
    }

    const rows: PayrollPreviewRow[] = Object.values(groupedByWorker).map(({ worker, timesheets }: any) => {
      // Filter timesheets within period
      const periodTs = timesheets.filter((t: any) => t.date >= periodStart && t.date <= periodEnd);
      const result = calculateWorkerPayroll({
        worker,
        timesheets: periodTs,
        isResident: worker.is_resident ?? true,
        allowances: periodTs.reduce((sum: number, t: any) => sum + Number(t.allowance_amount || 0), 0),
      });
      return { worker, timesheets: periodTs, result };
    });

    setPreview(rows.filter(r => r.timesheets.length > 0));
  };

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      if (!preview || preview.length === 0) throw new Error("No payroll data");

      const totalGross = preview.reduce((s, r) => s + r.result.grossEarnings, 0);
      const totalDeductions = preview.reduce((s, r) => s + r.result.fortnightlyPaye + r.result.employeeSuper + r.result.otherDeductions, 0);
      const totalNet = preview.reduce((s, r) => s + r.result.netPay, 0);

      // Create payroll cycle
      const { data: cycle, error: cycleError } = await db
        .from("payroll_cycles")
        .insert({
          period_start: periodStart,
          period_end: periodEnd,
          status: "pending_approval",
          total_workers: preview.length,
          total_gross: totalGross,
          total_deductions: totalDeductions,
          total_net: totalNet,
          created_by: user?.id,
        })
        .select()
        .single();
      if (cycleError) throw cycleError;

      // Create payslips
      const payslips = preview.map(row => ({
        cycle_id: cycle.id,
        worker_id: row.worker.id,
        period_start: periodStart,
        period_end: periodEnd,
        total_hours: row.result.approvedHours,
        hourly_rate: row.worker.hourly_rate || 0,
        gross_pay: row.result.grossEarnings,
        overtime_pay: row.result.hourlyComponent,
        allowance_pay: row.timesheets.reduce((s: number, t: any) => s + Number(t.allowance_amount || 0), 0),
        tax_deduction: row.result.fortnightlyPaye,
        nasfund_deduction: row.result.employeeSuper,
        other_deductions: row.result.otherDeductions,
        deductions: row.result.fortnightlyPaye + row.result.employeeSuper + row.result.otherDeductions,
        net_pay: row.result.netPay,
        status: "generated",
        generated_by: user?.id,
      }));

      const { error: payslipError } = await db.from("payslips").insert(payslips);
      if (payslipError) throw payslipError;

      return cycle;
    },
    onSuccess: () => {
      toast.success("Payroll run created and submitted for approval!");
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ["clerk-verified-timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-cycles"] });
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Clerk-Verified Timesheets Ready for Payroll
          </CardTitle>
          <CardDescription>
            {workerCount} worker(s) with verified timesheets available
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Period Start</label>
              <input type="date" className="block mt-1 border rounded px-3 py-2 text-sm bg-background" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Period End</label>
              <input type="date" className="block mt-1 border rounded px-3 py-2 text-sm bg-background" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
            </div>
            <Button onClick={handleRunPayroll} className="gap-2" disabled={!periodStart || !periodEnd}>
              <Calculator size={16} />
              Run Payroll for [{periodStart || "..."} – {periodEnd || "..."}]
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Preview</CardTitle>
            <CardDescription>{preview.length} employee(s) in this run</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">OT Hours</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">PAYE Tax</TableHead>
                    <TableHead className="text-right">Nasfund 6%</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map(row => (
                    <TableRow key={row.worker.id}>
                      <TableCell className="font-medium">{row.worker.full_name}</TableCell>
                      <TableCell className="text-right">{row.result.approvedHours.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{row.result.overtimeHours.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{formatKina(row.result.grossEarnings)}</TableCell>
                      <TableCell className="text-right">{formatKina(row.result.fortnightlyPaye)}</TableCell>
                      <TableCell className="text-right">{formatKina(row.result.employeeSuper)}</TableCell>
                      <TableCell className="text-right font-bold">{formatKina(row.result.netPay)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 border-primary/20 font-bold">
                    <TableCell>TOTALS</TableCell>
                    <TableCell className="text-right">{preview.reduce((s, r) => s + r.result.approvedHours, 0).toFixed(1)}</TableCell>
                    <TableCell className="text-right">{preview.reduce((s, r) => s + r.result.overtimeHours, 0).toFixed(1)}</TableCell>
                    <TableCell className="text-right">{formatKina(preview.reduce((s, r) => s + r.result.grossEarnings, 0))}</TableCell>
                    <TableCell className="text-right">{formatKina(preview.reduce((s, r) => s + r.result.fortnightlyPaye, 0))}</TableCell>
                    <TableCell className="text-right">{formatKina(preview.reduce((s, r) => s + r.result.employeeSuper, 0))}</TableCell>
                    <TableCell className="text-right">{formatKina(preview.reduce((s, r) => s + r.result.netPay, 0))}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                size="lg"
                className="gap-2"
                onClick={() => finalizeMutation.mutate()}
                disabled={finalizeMutation.isPending}
              >
                {finalizeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle size={16} />}
                Approve &amp; Finalise Payroll
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verified Timesheets Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {workerCount === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                <AlertCircle size={18} />
                <span>No clerk-verified timesheets available. Timesheets must be verified by a clerk first.</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead className="text-right">Entries</TableHead>
                    <TableHead className="text-right">Total Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(groupedByWorker).map(({ worker, timesheets }: any) => (
                    <TableRow key={worker?.id}>
                      <TableCell className="font-medium">{worker?.full_name}</TableCell>
                      <TableCell>{worker?.position || "—"}</TableCell>
                      <TableCell className="text-right">{timesheets.length}</TableCell>
                      <TableCell className="text-right">
                        {timesheets.reduce((s: number, t: any) => s + Number(t.total_hours || 0), 0).toFixed(1)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">Verified</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
