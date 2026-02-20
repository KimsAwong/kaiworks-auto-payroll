import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Clock, DollarSign, TrendingUp, TrendingDown, UserCheck, AlertTriangle, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useWorkforceStats, usePayrollStats, useTimesheetStats, useContractAlerts } from "@/hooks/useAnalytics";

export default function CEOAnalytics() {
  const { data: workforce, isLoading: loadingWorkforce } = useWorkforceStats();
  const { data: payroll, isLoading: loadingPayroll } = usePayrollStats();
  const { data: timesheetStats, isLoading: loadingTimesheets } = useTimesheetStats();
  const { data: contractAlerts } = useContractAlerts();

  const isLoading = loadingWorkforce || loadingPayroll || loadingTimesheets;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const employmentBreakdown = [
    { name: 'Permanent', value: workforce?.permanent || 0, color: 'hsl(145, 72%, 28%)' },
    { name: 'Temporary', value: workforce?.temporary || 0, color: 'hsl(45, 93%, 47%)' },
  ];

  const avgAttendance = timesheetStats?.weeklyAttendance?.length
    ? Math.round(timesheetStats.weeklyAttendance.reduce((s, w) => s + w.rate, 0) / timesheetStats.weeklyAttendance.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">CEO Analytics Dashboard</h1>
        <p className="text-muted-foreground">Complete workforce performance overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workforce</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workforce?.totalWorkforce || 0}</div>
            <p className="text-xs text-muted-foreground">
              {workforce?.permanent || 0} permanent, {workforce?.temporary || 0} temporary
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">K {(payroll?.totalPayrollPaid || 0).toLocaleString()}</div>
            <p className="text-xs text-warning flex items-center gap-1">
              K {(payroll?.pendingPayroll || 0).toLocaleString()} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAttendance}%</div>
            <p className="text-xs text-muted-foreground">Based on recent 4 weeks</p>
          </CardContent>
        </Card>

        <Card>
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

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Payroll Trend
            </CardTitle>
            <CardDescription>Total payroll expenses over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {payroll?.monthlyPayroll && payroll.monthlyPayroll.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payroll.monthlyPayroll}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `K${(value/1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [`K ${value.toLocaleString()}`, 'Payroll']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="amount" fill="hsl(145, 72%, 28%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No payroll data yet. Approve timesheets to generate payslips.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Summary
            </CardTitle>
            <CardDescription>Key financial metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
                <div>
                  <p className="text-sm text-muted-foreground">Total Approved Hours</p>
                  <p className="text-2xl font-bold">{(timesheetStats?.totalApprovedHours || 0).toFixed(1)}</p>
                </div>
                <Clock className="h-8 w-8 text-primary/40" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-warning/10">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Timesheets</p>
                  <p className="text-2xl font-bold">{timesheetStats?.pendingCount || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning/40" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10">
                <div>
                  <p className="text-sm text-muted-foreground">Total Deductions</p>
                  <p className="text-2xl font-bold">K {(payroll?.totalDeductions || 0).toLocaleString()}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-destructive/40" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Weekly Attendance Trend
            </CardTitle>
            <CardDescription>Approval rate by week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {timesheetStats?.weeklyAttendance && timesheetStats.weeklyAttendance.some(w => w.rate > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timesheetStats.weeklyAttendance}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis className="text-xs" domain={[0, 100]} />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, 'Attendance']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Line type="monotone" dataKey="rate" stroke="hsl(145, 72%, 28%)" strokeWidth={2} dot={{ fill: 'hsl(145, 72%, 28%)' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No attendance data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Employment Breakdown
            </CardTitle>
            <CardDescription>Permanent vs Temporary</CardDescription>
          </CardHeader>
          <CardContent>
            {(workforce?.totalWorkforce || 0) > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={employmentBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {employmentBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value} workers`, '']}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
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
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                No approved workers yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contract Alerts */}
      {contractAlerts && contractAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Contract Alerts
            </CardTitle>
            <CardDescription>Contracts expiring within 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {contractAlerts.map((contract: any) => (
              <div key={contract.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                <div>
                  <p className="font-medium">{contract.worker?.full_name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{contract.worker?.position || 'No position'}</p>
                </div>
                <Badge className="bg-warning text-warning-foreground">
                  {new Date(contract.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
