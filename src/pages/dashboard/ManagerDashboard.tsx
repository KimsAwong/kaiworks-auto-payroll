import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, DollarSign, Clock, ArrowRight, Loader2, UserCheck, 
  FileSignature, AlertTriangle, Briefcase
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkforceStats, usePayrollStats, useTimesheetStats, useContractAlerts } from "@/hooks/useAnalytics";
import { usePendingApprovals } from "@/hooks/useAccountApprovals";
import { useAllWorkSummaries } from "@/hooks/useWorkSummaries";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { data: workforce, isLoading } = useWorkforceStats();
  const { data: payroll } = usePayrollStats();
  const { data: timesheetStats } = useTimesheetStats();
  const { data: contractAlerts } = useContractAlerts();
  const { data: pendingApprovals } = usePendingApprovals();
  const { data: allSummaries } = useAllWorkSummaries();

  const unreviewedSummaries = allSummaries?.filter((s: any) => s.status === 'submitted').length || 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl bg-sidebar p-6 text-sidebar-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              {greeting()}, {user?.full_name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-sidebar-foreground/80 mt-1">
              General Manager Dashboard — Operational management
            </p>
          </div>
          <Badge className="bg-sidebar-accent text-sidebar-accent-foreground border-0 gap-1 self-start">
            <Briefcase size={14} /> Manager
          </Badge>
        </div>
      </div>

      {/* Role Description */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Your Role:</strong> As General Manager, you handle operational management including 
            adding/removing supervisors and workers, setting pay rates, approving contracts, managing 
            timesheets, and overseeing the daily operations of the workforce.
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workforce?.totalWorkforce || 0}</div>
            <p className="text-xs text-muted-foreground">{workforce?.permanent || 0} permanent · {workforce?.temporary || 0} temp</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Timesheets</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timesheetStats?.pendingCount || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payroll (Pending)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">K {(payroll?.pendingPayroll || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">K {(payroll?.totalPayrollPaid || 0).toLocaleString()} paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contract Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractAlerts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Expiring within 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(pendingApprovals?.length > 0 || unreviewedSummaries > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {pendingApprovals && pendingApprovals.length > 0 && (
            <Card className="border-warning/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserCheck className="h-5 w-5 text-warning" />
                  {pendingApprovals.length} Pending Account Approval{pendingApprovals.length > 1 ? 's' : ''}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link to="/workers"><Button variant="outline" size="sm" className="gap-2">Review <ArrowRight size={14} /></Button></Link>
              </CardContent>
            </Card>
          )}
          {unreviewedSummaries > 0 && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSignature className="h-5 w-5 text-primary" />
                  {unreviewedSummaries} Work Summaries to Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link to="/workers"><Button variant="outline" size="sm" className="gap-2">Review <ArrowRight size={14} /></Button></Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Manage your workforce operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/workers"><Button variant="outline" className="w-full gap-2 justify-start"><Users size={16} />Manage Workers</Button></Link>
            <Link to="/timesheet"><Button variant="outline" className="w-full gap-2 justify-start"><Clock size={16} />Enter Timesheets</Button></Link>
            <Link to="/contracts"><Button variant="outline" className="w-full gap-2 justify-start"><FileSignature size={16} />Manage Contracts</Button></Link>
            <Link to="/payslips"><Button variant="outline" className="w-full gap-2 justify-start"><DollarSign size={16} />View Payslips</Button></Link>
            <Link to="/accounts"><Button variant="outline" className="w-full gap-2 justify-start"><DollarSign size={16} />Financial Accounts</Button></Link>
            <Link to="/reports"><Button variant="outline" className="w-full gap-2 justify-start"><FileSignature size={16} />Reports</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
