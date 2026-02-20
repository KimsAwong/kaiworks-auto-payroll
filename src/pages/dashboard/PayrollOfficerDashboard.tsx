import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, Clock, FileText, ArrowRight, Loader2, Users, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTimesheetStats, usePayrollStats } from "@/hooks/useAnalytics";
import { usePayrollCycles } from "@/hooks/usePayrollCycles";

export default function PayrollOfficerDashboard() {
  const { user } = useAuth();
  const { data: timesheetStats, isLoading: loadingTs } = useTimesheetStats();
  const { data: payroll, isLoading: loadingPayroll } = usePayrollStats();
  const { data: cycles } = usePayrollCycles();

  const pendingVerification = cycles?.filter(c => c.status === 'draft').length || 0;
  const inVerification = cycles?.filter(c => c.status === 'verification').length || 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loadingTs || loadingPayroll) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-primary p-6 text-primary-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              {greeting()}, {user?.full_name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-primary-foreground/80 mt-1">
              Payroll Officer Dashboard — Collect, verify & calculate wages
            </p>
          </div>
          <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 gap-1 self-start">
            <Calculator size={14} /> Payroll Officer
          </Badge>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Your Role:</strong> Collect timesheets from supervisors, verify hours worked, 
            calculate wages/taxes/deductions (PNG 2026 rules), and submit payroll cycles for CEO approval. 
            You ensure workers are paid accurately and on time.
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
            <FileText className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timesheetStats?.pendingCount || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting supervisor approval</p>
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
            <CardTitle className="text-sm font-medium">In Verification</CardTitle>
            <Calculator className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inVerification}</div>
            <p className="text-xs text-muted-foreground">Being calculated</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payroll Actions</CardTitle>
          <CardDescription>Core payroll processing tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/payroll-wizard">
              <Button className="w-full gap-2 justify-start"><Calculator size={16} />Process Payroll</Button>
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
