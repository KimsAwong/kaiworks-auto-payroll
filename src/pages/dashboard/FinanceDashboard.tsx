import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ArrowRight, Loader2, Banknote, FileText, TrendingUp, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePayrollStats } from "@/hooks/useAnalytics";
import { usePayrollCycles } from "@/hooks/usePayrollCycles";

export default function FinanceDashboard() {
  const { user } = useAuth();
  const { data: payroll, isLoading } = usePayrollStats();
  const { data: cycles } = usePayrollCycles();

  const approvedCycles = cycles?.filter(c => c.status === 'approved').length || 0;
  const paidCycles = cycles?.filter(c => c.status === 'paid').length || 0;

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
      <div className="rounded-xl bg-sidebar p-6 text-sidebar-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              {greeting()}, {user?.full_name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-sidebar-foreground/80 mt-1">
              Finance Dashboard — Process payments & manage company budget
            </p>
          </div>
          <Badge className="bg-sidebar-accent text-sidebar-accent-foreground border-0 gap-1 self-start">
            <Banknote size={14} /> Finance / Accountant
          </Badge>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Your Role:</strong> Process approved payroll payments, manage bank transfers, 
            handle invoicing, and manage the company budget. Once CEO approves a payroll cycle, 
            you mark it as paid after processing the actual bank transfers.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">K {(payroll?.totalPayrollPaid || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">K {(payroll?.pendingPayroll || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Approved, awaiting transfer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Cycles</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCycles}</div>
            <p className="text-xs text-muted-foreground">Ready to process payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Cycles</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidCycles}</div>
            <p className="text-xs text-muted-foreground">Successfully paid</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Finance Actions</CardTitle>
          <CardDescription>Payment processing and financial management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/payroll-wizard">
              <Button className="w-full gap-2 justify-start"><Banknote size={16} />Process Payments</Button>
            </Link>
            <Link to="/payroll-history">
              <Button variant="outline" className="w-full gap-2 justify-start"><FileText size={16} />Payment History</Button>
            </Link>
            <Link to="/workers">
              <Button variant="outline" className="w-full gap-2 justify-start"><DollarSign size={16} />Worker Payslips</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
