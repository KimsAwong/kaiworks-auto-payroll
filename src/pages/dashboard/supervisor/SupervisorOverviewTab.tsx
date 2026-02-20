import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, ArrowRight, UserCheck, FileText, ClipboardList, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTimesheets } from "@/hooks/useTimesheets";
import { useAllProfiles } from "@/hooks/useProfile";
import { usePendingApprovals } from "@/hooks/useAccountApprovals";
import { useAllWorkSummaries } from "@/hooks/useWorkSummaries";

export default function SupervisorOverviewTab() {
  const { user } = useAuth();
  const { data: timesheets } = useTimesheets();
  const { data: allProfiles } = useAllProfiles();
  const { data: pendingApprovals } = usePendingApprovals();
  const { data: allSummaries } = useAllWorkSummaries();

  const myTeam = allProfiles?.filter(p => p.supervisor_id === user?.id && p.account_status === 'approved') || [];
  const pendingTimesheets = timesheets?.filter((t: any) => t.status === 'pending').length || 0;
  const todayEntries = timesheets?.filter((t: any) => t.date === new Date().toISOString().split('T')[0]).length || 0;
  const unreviewedSummaries = allSummaries?.filter((s: any) => s.status === 'submitted').length || 0;

  return (
    <div className="space-y-6">
      {/* Role Description */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Your Role:</strong> As Supervisor, you manage assigned worker teams.
            You enter daily clock-in/clock-out times, approve account requests,
            review fortnightly work summaries, and monitor team activity.
            <strong> Workers cannot enter their own hours</strong> — only you can record their time.
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Team</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTeam.length}</div>
            <p className="text-xs text-muted-foreground">Active workers assigned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Timesheets</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTimesheets}</div>
            <p className="text-xs text-muted-foreground">Awaiting your approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Entries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEntries}</div>
            <p className="text-xs text-muted-foreground">Timesheets entered today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Summaries to Review</CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreviewedSummaries}</div>
            <p className="text-xs text-muted-foreground">Fortnightly reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals && pendingApprovals.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-5 w-5 text-warning" />
              {pendingApprovals.length} Pending Account Approval{pendingApprovals.length > 1 ? 's' : ''}
            </CardTitle>
            <CardDescription>New workers need your approval to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="gap-2">Review in My Team tab <ArrowRight size={14} /></Button>
          </CardContent>
        </Card>
      )}

      {/* Team List */}
      {myTeam.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myTeam.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{w.full_name}</p>
                    <p className="text-xs text-muted-foreground">{w.position || 'No position'} · {w.employment_type}</p>
                  </div>
                  <Badge variant="outline">K {Number(w.hourly_rate || 0).toFixed(2)}/hr</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
