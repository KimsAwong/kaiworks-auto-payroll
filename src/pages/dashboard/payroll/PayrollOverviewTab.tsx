import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Clock, FileText, Users, ClipboardCheck, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTimesheetStats, usePayrollStats } from "@/hooks/useAnalytics";
import { usePayrollCycles } from "@/hooks/usePayrollCycles";

export default function PayrollOverviewTab() {
  const { data: timesheetStats, isLoading: loadingTs } = useTimesheetStats();
  const { data: payroll, isLoading: loadingPayroll } = usePayrollStats();
  const { data: cycles } = usePayrollCycles();

  const pendingVerification = cycles?.filter(c => c.status === "draft").length || 0;
  const inVerification = cycles?.filter(c => c.status === "verification").length || 0;

  if (loadingTs || loadingPayroll) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Your Role:</strong> Collect clerk-verified timesheets, calculate wages/taxes/deductions
            (PNG 2026 rules), and run payroll cycles. Workers get paid accurately and on time.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Hours</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(timesheetStats?.totalApprovedHours || 0).toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Ready for payroll</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Timesheets</CardTitle>
            <FileText className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timesheetStats?.pendingCount || 0}</div>
            <p className="text-xs text-muted-foreground">In supervisor/clerk pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Cycles</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingVerification}</div>
            <p className="text-xs text-muted-foreground">Ready to process</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
            <Calculator className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">K {(payroll?.totalPayrollPaid || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Core payroll processing tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Link to="/payroll-wizard">
              <Button className="w-full gap-2 justify-start"><Calculator size={16} />Run Payroll Wizard</Button>
            </Link>
            <Link to="/attendance-overview">
              <Button variant="outline" className="w-full gap-2 justify-start"><Clock size={16} />View All Timesheets</Button>
            </Link>
            <Link to="/payroll-history">
              <Button variant="outline" className="w-full gap-2 justify-start"><FileText size={16} />Payroll History</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
