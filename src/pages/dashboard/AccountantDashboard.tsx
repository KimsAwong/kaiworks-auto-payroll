import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, FileText, Users, ArrowRight, Loader2, TrendingUp, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePayrollStats, useWorkforceStats } from "@/hooks/useAnalytics";

export default function AccountantDashboard() {
  const { user } = useAuth();
  const { data: payroll, isLoading } = usePayrollStats();
  const { data: workforce } = useWorkforceStats();

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
              Accountant Dashboard — Financial monitoring & payroll
            </p>
          </div>
          <Badge className="bg-sidebar-accent text-sidebar-accent-foreground border-0 gap-1 self-start">
            <Wallet size={14} /> Accountant
          </Badge>
        </div>
      </div>

      {/* Role Description */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Your Role:</strong> As Accountant, you are responsible for monitoring funds, 
            spending, and the overall financial health of the organization. You can view payroll records, 
            manage financial transactions, generate reports, and ensure accurate bookkeeping.
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">K {(payroll?.totalPayrollPaid || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All-time payroll</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">K {(payroll?.pendingPayroll || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Generated, not yet paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">K {(payroll?.totalDeductions || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all payslips</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workforce?.totalWorkforce || 0}</div>
            <p className="text-xs text-muted-foreground">On payroll</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Operations</CardTitle>
          <CardDescription>Manage the organization's finances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/accounts"><Button className="w-full gap-2 justify-start"><Wallet size={16} />Financial Accounts</Button></Link>
            <Link to="/payroll"><Button variant="outline" className="w-full gap-2 justify-start"><FileText size={16} />Payroll Records</Button></Link>
            <Link to="/workers"><Button variant="outline" className="w-full gap-2 justify-start"><Users size={16} />Worker Details</Button></Link>
            <Link to="/reports"><Button variant="outline" className="w-full gap-2 justify-start"><TrendingUp size={16} />Reports</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
