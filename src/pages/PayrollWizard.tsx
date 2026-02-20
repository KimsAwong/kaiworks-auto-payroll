import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calculateWorkerPayroll, generateAndStorePayslipPdf, formatKina } from "@/lib/payroll-engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { usePayrollCycles, useCreatePayrollCycle, useUpdateCycleStatus, PayrollCycle } from "@/hooks/usePayrollCycles";
import { Calculator, CheckCircle, Banknote, Send, Loader2 } from "lucide-react";

const payrollWizardSchema = z.object({
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
});

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  verification: { label: "Verification", color: "bg-warning text-warning-foreground" },
  pending_approval: { label: "Pending CEO Approval", color: "bg-primary text-primary-foreground" },
  approved: { label: "Approved", color: "bg-success text-success-foreground" },
  paid: { label: "Paid", color: "bg-success text-success-foreground" },
};

export default function PayrollWizard() {
  const { user, primaryRole, isCEO, isFinance, isPayrollOfficer } = useAuth();
  const queryClient = useQueryClient();
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const { data: cycles, isLoading: loadingCycles } = usePayrollCycles();
  const createCycle = useCreatePayrollCycle();
  const updateCycleStatus = useUpdateCycleStatus();

  const { data: workers, isLoading: loadingWorkers } = useQuery({
    queryKey: ["payroll-workers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("account_status", "approved")
        .eq("is_active", true)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Create a new payroll cycle (Payroll Officer)
  const handleCreateCycle = async () => {
    try {
      payrollWizardSchema.parse({ periodStart, periodEnd });
      await createCycle.mutateAsync({ periodStart, periodEnd });
      toast.success("Payroll cycle created as draft.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create cycle");
    }
  };

  // Run payroll calculation & generate payslips (Payroll Officer - moves draft → verification)
  const runPayroll = useMutation({
    mutationFn: async (cycleId: string) => {
      const cycle = cycles?.find(c => c.id === cycleId);
      if (!cycle) throw new Error("Cycle not found");

      let totalGross = 0, totalDeductions = 0, totalNet = 0, totalWorkers = 0;
      const noRateWorkers: string[] = [];

      for (const worker of workers ?? []) {
        const { data: timesheets, error: tsError } = await supabase
          .from("timesheets")
          .select("*")
          .eq("worker_id", worker.id)
          .eq("status", "approved")
          .gte("date", cycle.period_start)
          .lte("date", cycle.period_end);
        if (tsError) throw tsError;

        if (!timesheets?.length) continue;

        if (!worker.hourly_rate || Number(worker.hourly_rate) === 0) {
          noRateWorkers.push(worker.full_name ?? worker.id);
        }

        const result = calculateWorkerPayroll({
          worker,
          timesheets: timesheets ?? [],
          isResident: true,
        });

        // Delete any existing payslip for this worker+cycle to avoid duplicates
        await supabase.from("payslips").delete()
          .eq("worker_id", worker.id)
          .eq("cycle_id", cycleId);

        const { data: payslip, error: payslipError } = await supabase
          .from("payslips")
          .insert({
            worker_id: worker.id,
            period_start: cycle.period_start,
            period_end: cycle.period_end,
            total_hours: result.approvedHours,
            hourly_rate: Number(worker.hourly_rate ?? 0),
            gross_pay: result.grossEarnings,
            deductions: result.fortnightlyPaye + result.employeeSuper + result.otherDeductions,
            net_pay: result.netPay,
            status: "generated",
            generated_by: user?.id ?? null,
            cycle_id: cycleId,
          } as any)
          .select()
          .single();
        if (payslipError) throw payslipError;

        totalGross += result.grossEarnings;
        totalDeductions += result.fortnightlyPaye + result.employeeSuper + result.otherDeductions;
        totalNet += result.netPay;
        totalWorkers++;

        try {
          await generateAndStorePayslipPdf({ payslip: payslip as any, worker });
        } catch (pdfErr) {
          console.warn("PDF generation skipped:", pdfErr);
        }
      }

      if (noRateWorkers.length > 0) {
        toast.warning(`${noRateWorkers.length} worker(s) have K0 hourly rate: ${noRateWorkers.slice(0,3).join(', ')}${noRateWorkers.length > 3 ? '…' : ''}. Set their rates in Workers → Edit Profile.`);
      }

      // Move to verification status
      await updateCycleStatus.mutateAsync({
        cycleId,
        status: 'verification',
        totals: { total_workers: totalWorkers, total_gross: totalGross, total_deductions: totalDeductions, total_net: totalNet },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
      toast.success("Payroll calculated. Cycle moved to verification.");
    },
    onError: (error: any) => toast.error(error.message ?? "Payroll calculation failed"),
  });

  // Submit for CEO approval (Payroll Officer - moves verification → pending_approval)
  const submitForApproval = async (cycleId: string) => {
    try {
      await updateCycleStatus.mutateAsync({ cycleId, status: 'pending_approval' });
      toast.success("Payroll submitted for CEO approval.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit for approval");
    }
  };

  // CEO approves (moves pending_approval → approved)
  const approveCycle = async (cycleId: string) => {
    try {
      await updateCycleStatus.mutateAsync({ cycleId, status: 'approved' });
      toast.success("Payroll cycle approved by CEO.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to approve cycle");
    }
  };

  // Finance marks as paid (moves approved → paid)
  const markAsPaid = async (cycleId: string) => {
    try {
      // Also update all payslips in the cycle to 'paid'
      const { data: cyclePayslips } = await supabase
        .from("payslips")
        .select("id")
        .filter("cycle_id", "eq", cycleId);
      
      if (cyclePayslips && cyclePayslips.length > 0) {
        const { error: updateError } = await supabase
          .from("payslips")
          .update({
            status: "paid" as const,
            paid_by: user?.id ?? null,
            paid_at: new Date().toISOString(),
          })
          .in("id", cyclePayslips.map(p => p.id));
        if (updateError) throw updateError;
      }

      await updateCycleStatus.mutateAsync({ cycleId, status: 'paid' });
      toast.success("Payroll marked as paid. Workers can now see their payslips.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to mark as paid");
    }
  };

  const canCreateCycle = isPayrollOfficer || isCEO;
  const canCalculate = isPayrollOfficer || isCEO;
  const canSubmitForApproval = isPayrollOfficer || isCEO;
  const canApprove = isCEO;
  const canMarkPaid = isFinance || isCEO;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Create New Cycle */}
      {canCreateCycle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator size={20} /> Create Payroll Cycle
            </CardTitle>
            <CardDescription>
              Step 1: Create a new payroll cycle for a pay period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Period Start</label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Period End</label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Active workers: {loadingWorkers ? "-" : workers?.length ?? 0}
              {!loadingWorkers && workers && workers.filter(w => !w.hourly_rate || Number(w.hourly_rate) === 0).length > 0 && (
                <span className="ml-2 text-warning font-medium">
                  ⚠ {workers.filter(w => !w.hourly_rate || Number(w.hourly_rate) === 0).length} worker(s) have K0.00/hr — set their rate in Workers page before running payroll
                </span>
              )}
            </div>
            <Button
              disabled={createCycle.isPending || !periodStart || !periodEnd}
              onClick={handleCreateCycle}
            >
              {createCycle.isPending ? "Creating..." : "Create Draft Cycle"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Cycles */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Cycles</CardTitle>
          <CardDescription>
            Workflow: Draft → Verification → CEO Approval → Approved → Paid
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCycles && (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {!loadingCycles && (!cycles || cycles.length === 0) && (
            <div className="text-sm text-muted-foreground py-8 text-center">No payroll cycles yet.</div>
          )}

          {!loadingCycles && cycles && cycles.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Workers</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.map((cycle) => {
                  const st = statusLabels[cycle.status] || statusLabels.draft;
                  return (
                    <TableRow key={cycle.id}>
                      <TableCell className="text-sm">
                        {cycle.period_start} → {cycle.period_end}
                      </TableCell>
                      <TableCell>
                        <Badge className={st.color}>{st.label}</Badge>
                      </TableCell>
                      <TableCell>{cycle.total_workers}</TableCell>
                      <TableCell>{formatKina(cycle.total_gross)}</TableCell>
                      <TableCell className="font-medium">{formatKina(cycle.total_net)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {cycle.status === 'draft' && canCalculate && (
                            <Button size="sm" variant="outline" className="gap-1"
                              disabled={runPayroll.isPending}
                              onClick={() => runPayroll.mutate(cycle.id)}>
                              {runPayroll.isPending ? <Loader2 size={14} className="animate-spin" /> : <Calculator size={14} />}
                              Calculate
                            </Button>
                          )}
                          {cycle.status === 'verification' && canSubmitForApproval && (
                            <Button size="sm" variant="outline" className="gap-1"
                              disabled={updateCycleStatus.isPending}
                              onClick={() => submitForApproval(cycle.id)}>
                              <Send size={14} /> Submit for Approval
                            </Button>
                          )}
                          {cycle.status === 'pending_approval' && canApprove && (
                            <Button size="sm" className="gap-1 bg-success hover:bg-success/90"
                              disabled={updateCycleStatus.isPending}
                              onClick={() => approveCycle(cycle.id)}>
                              <CheckCircle size={14} /> CEO Approve
                            </Button>
                          )}
                          {cycle.status === 'approved' && canMarkPaid && (
                            <Button size="sm" className="gap-1"
                              disabled={updateCycleStatus.isPending}
                              onClick={() => markAsPaid(cycle.id)}>
                              <Banknote size={14} /> Mark Paid
                            </Button>
                          )}
                          {cycle.status === 'paid' && (
                            <span className="text-xs text-muted-foreground">✓ Complete</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
