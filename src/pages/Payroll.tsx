import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatKina } from "@/lib/payroll-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Calculator, CheckCircle, Loader2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface EntryPreview {
  worker: Profile;
  grossEarnings: number;
  fortnightlyPaye: number;
  employeeSuper: number;
  netPay: number;
  effectiveTaxRate: string;
}

export default function Payroll() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [entries, setEntries] = useState<EntryPreview[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("*")
      .eq("is_active", true).eq("account_status", "approved")
      .then(({ data }) => { if (data) setWorkers(data); });
  }, []);

  const runCalculations = () => {
    if (!periodStart || !periodEnd) { toast.error("Set period dates"); return; }
    const results = workers.map((w) => {
      const hourlyRate = Number(w.hourly_rate ?? 0);
      // Simple estimate: use hourly_rate * 80 for permanent, hourly_rate * 40 for temporary
      const hours = w.employment_type === "temporary" ? 40 : 80;
      const grossEarnings = hourlyRate * hours;
      const annualized = grossEarnings * 26;
      let annualPaye = 0;
      // Assume resident for now
      if (annualized > 250000) annualPaye = 88850 + (annualized - 250000) * 0.42;
      else if (annualized > 70000) annualPaye = 16850 + (annualized - 70000) * 0.40;
      else if (annualized > 33000) annualPaye = 3900 + (annualized - 33000) * 0.35;
      else if (annualized > 20000) annualPaye = (annualized - 20000) * 0.30;

      const fortnightlyPaye = Number((annualPaye / 26).toFixed(2));
      const employeeSuper = Number((grossEarnings * 0.06).toFixed(2));
      const netPay = Number((grossEarnings - fortnightlyPaye - employeeSuper).toFixed(2));
      const effectiveTaxRate = grossEarnings > 0 ? ((fortnightlyPaye / grossEarnings) * 100).toFixed(1) : '0.0';
      return { worker: w, grossEarnings, fortnightlyPaye, employeeSuper, netPay, effectiveTaxRate };
    });
    setEntries(results);
    setStep(2);
  };

  const savePayroll = async () => {
    setSaving(true);
    const payslipRows = entries.map((e) => ({
      worker_id: e.worker.id,
      period_start: periodStart,
      period_end: periodEnd,
      total_hours: e.worker.employment_type === "temporary" ? 40 : 80,
      hourly_rate: Number(e.worker.hourly_rate ?? 0),
      gross_pay: e.grossEarnings,
      deductions: e.fortnightlyPaye + e.employeeSuper,
      net_pay: e.netPay,
      status: "generated" as const,
      generated_by: user?.id ?? null,
    }));

    const { error } = await supabase.from("payslips").insert(payslipRows);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Payroll saved and payslips generated!");
    setStep(3);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Run Payroll</h1>
        <p className="page-subtitle">PNG 2026 compliant payroll wizard</p>
      </div>

      <div className="flex items-center gap-2 text-sm">
        {["Set Period", "Preview & Calculate", "Confirm"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${step > i + 1 ? "bg-success text-success-foreground" : step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {step > i + 1 ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span className={step === i + 1 ? "font-medium text-foreground" : "text-muted-foreground"}>{s}</span>
            {i < 2 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Payroll Period</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} /></div>
              <div><Label>End Date</Label><Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} /></div>
            </div>
            <p className="text-sm text-muted-foreground">{workers.length} active workers will be included</p>
            <Button onClick={runCalculations}><Calculator className="h-4 w-4 mr-2" />Calculate Payroll</Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">Total Gross</p><p className="text-xl font-bold">{formatKina(entries.reduce((s, e) => s + e.grossEarnings, 0))}</p></div>
            <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">Total PAYE</p><p className="text-xl font-bold">{formatKina(entries.reduce((s, e) => s + e.fortnightlyPaye, 0))}</p></div>
            <div className="stat-card"><p className="text-xs text-muted-foreground mb-1">Total Net</p><p className="text-xl font-bold">{formatKina(entries.reduce((s, e) => s + e.netPay, 0))}</p></div>
          </div>

          <div className="bg-card rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>PAYE</TableHead>
                  <TableHead>Super (6%)</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Eff. Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.worker.id}>
                    <TableCell>
                      <div><span className="font-medium">{e.worker.full_name}</span><br /><span className="text-xs text-muted-foreground">{e.worker.employment_type}</span></div>
                    </TableCell>
                    <TableCell>{formatKina(e.grossEarnings)}</TableCell>
                    <TableCell className="text-destructive">{formatKina(e.fortnightlyPaye)}</TableCell>
                    <TableCell>{formatKina(e.employeeSuper)}</TableCell>
                    <TableCell className="font-semibold">{formatKina(e.netPay)}</TableCell>
                    <TableCell>{e.effectiveTaxRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={savePayroll} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save & Submit
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Payroll Submitted!</h2>
            <p className="text-muted-foreground mb-4">Payslips have been generated for all workers.</p>
            <Button onClick={() => { setStep(1); setEntries([]); }}>Run Another Cycle</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
