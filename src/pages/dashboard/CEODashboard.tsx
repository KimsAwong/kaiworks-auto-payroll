import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, DollarSign, TrendingUp, AlertTriangle, BarChart3, 
  Clock, ArrowRight, Loader2, UserCheck, FileSignature, Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkforceStats, usePayrollStats, useTimesheetStats, useContractAlerts } from "@/hooks/useAnalytics";
import { usePendingApprovals } from "@/hooks/useAccountApprovals";
import { useAllWorkSummaries } from "@/hooks/useWorkSummaries";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function CEODashboard() {
  const { user } = useAuth();
  const { data: workforce, isLoading: loadingWorkforce } = useWorkforceStats();
  const { data: payroll, isLoading: loadingPayroll } = usePayrollStats();
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

  const employmentBreakdown = [
    { name: 'Permanent', value: workforce?.permanent || 0, color: 'hsl(145, 72%, 28%)' },
    { name: 'Temporary', value: workforce?.temporary || 0, color: 'hsl(45, 93%, 47%)' },
  ];

  if (loadingWorkforce || loadingPayroll) {
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
              CEO Overview — Full organizational visibility and control
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <Badge className="bg-sidebar-accent text-sidebar-accent-foreground border-0">Owner/CEO</Badge>
          </div>
        </div>
      </div>

      {/* Role Description */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Your Role:</strong> As CEO/Owner, you have full visibility across the organization. 
            You can monitor manager/supervisor activity, view all workforce analytics, manage payroll, 
            approve contracts, broadcast messages to entire teams, and review deactivated account archives.
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workforce</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workforce?.totalWorkforce || 0}</div>
            <p className="text-xs text-muted-foreground">
              {workforce?.permanent || 0} permanent · {workforce?.temporary || 0} temporary
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">K {(payroll?.totalPayrollPaid || 0).toLocaleString()}</div>
            <p className="text-xs text-warning">K {(payroll?.pendingPayroll || 0).toLocaleString()} pending</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(timesheetStats?.totalApprovedHours || 0).toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">{timesheetStats?.pendingCount || 0} pending review</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contracts Expiring</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractAlerts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {pendingApprovals && pendingApprovals.length > 0 && (
          <Card className="border-warning/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="h-5 w-5 text-warning" />
                {pendingApprovals.length} Pending Account{pendingApprovals.length > 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link to="/workers">
                <Button variant="outline" size="sm" className="gap-2">
                  Review Approvals <ArrowRight size={14} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {unreviewedSummaries > 0 && (
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSignature className="h-5 w-5 text-primary" />
                {unreviewedSummaries} Unreviewed Work Summar{unreviewedSummaries > 1 ? 'ies' : 'y'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link to="/workers">
                <Button variant="outline" size="sm" className="gap-2">
                  Review Summaries <ArrowRight size={14} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payroll Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {payroll?.monthlyPayroll && payroll.monthlyPayroll.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payroll.monthlyPayroll}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `K${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [`K ${value.toLocaleString()}`, 'Payroll']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="amount" fill="hsl(145, 72%, 28%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No payroll data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Employment Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {(workforce?.totalWorkforce || 0) > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={employmentBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {employmentBreakdown.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6">
                  {employmentBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No workers yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/reports"><Button variant="outline" className="w-full gap-2 h-14"><BarChart3 size={18} />Full Analytics</Button></Link>
        <Link to="/workers"><Button variant="outline" className="w-full gap-2 h-14"><Users size={18} />All Workers</Button></Link>
        <Link to="/payroll-wizard"><Button variant="outline" className="w-full gap-2 h-14"><FileSignature size={18} />Payroll Approval</Button></Link>
        <Link to="/payroll-history"><Button variant="outline" className="w-full gap-2 h-14"><DollarSign size={18} />Payment History</Button></Link>
      </div>
    </div>
  );
}
