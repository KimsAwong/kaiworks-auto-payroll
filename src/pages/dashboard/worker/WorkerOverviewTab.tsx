import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, FileText, DollarSign, ArrowRight, User, Info } from "lucide-react";
import { Link } from "react-router-dom";

interface WorkerOverviewTabProps {
  thisWeekHours: number;
  latestPayslip: any;
  timesheetCount: number;
  pendingCount: number;
  user: any;
  primaryRole: string;
}

export default function WorkerOverviewTab({
  thisWeekHours, latestPayslip, timesheetCount, pendingCount, user, primaryRole
}: WorkerOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Role Description */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>How it works:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your <strong>supervisor enters</strong> your daily clock-in and clock-out times — you cannot enter your own hours</li>
                <li>Once approved, your <strong>payslip is automatically generated</strong> and can be downloaded as PDF</li>
                <li>Every <strong>two weeks</strong>, you must submit a fortnightly work summary describing your tasks and site work</li>
                <li>The summary resets at the start of each new fortnight (1st–15th and 16th–end of month)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekHours.toFixed(1)}</div>
            <Progress value={(thisWeekHours / 40) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">of 40 hours target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              K {latestPayslip ? Number(latestPayslip.net_pay).toLocaleString() : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestPayslip ? `${new Date(latestPayslip.period_start).toLocaleDateString()} period` : 'No payslips yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Timesheets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timesheetCount}</div>
            <p className="text-xs text-muted-foreground mt-1">All time entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-primary" />Timesheets
            </CardTitle>
            <CardDescription>View your work hours entered by your supervisor</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/timesheet"><Button variant="outline" className="w-full gap-2">View Timesheets <ArrowRight size={14} /></Button></Link>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary" />Payslips
            </CardTitle>
            <CardDescription>
              {latestPayslip ? `Latest: K ${Number(latestPayslip.net_pay).toLocaleString()}` : 'No payslips yet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/my-payslips"><Button variant="outline" className="w-full gap-2">View & Download <ArrowRight size={14} /></Button></Link>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5 text-primary" />Employment
            </CardTitle>
            <CardDescription>Position: {user?.position || '—'} • Rate: K {Number(user?.hourly_rate || 0).toFixed(2)}/hr</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge>{user?.employment_type || 'permanent'}</Badge>
            <Badge variant="outline" className="capitalize ml-2">{primaryRole}</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
