import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, FolderKanban, ArrowRight, Loader2, FileSignature } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteTimesheets } from "@/hooks/useSiteTimesheets";

export default function ClerkDashboard() {
  const { user } = useAuth();
  const { data: timesheets, isLoading } = useSiteTimesheets();

  const pendingCount = timesheets?.filter((t: any) => t.status === 'submitted').length || 0;
  const authorizedCount = timesheets?.filter((t: any) => t.status === 'authorized').length || 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-primary p-6 text-primary-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              {greeting()}, {user?.full_name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-primary-foreground/80 mt-1">Clerk Dashboard — Authorize site timesheets & review projects</p>
          </div>
          <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 gap-1 self-start">
            <FileSignature size={14} /> Clerk
          </Badge>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Your Role:</strong> Review and authorize site timesheets submitted by supervisors/foremen. 
            You can also create timesheets for nearby sites and view project summaries.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Authorization</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Timesheets awaiting your review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authorized</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authorizedCount}</div>
            <p className="text-xs text-muted-foreground">Total authorized timesheets</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Core clerk tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Link to="/clerk-approvals">
              <Button className="w-full gap-2 justify-start"><ClipboardCheck size={16} />Review Timesheets {pendingCount > 0 && <Badge className="bg-warning text-warning-foreground ml-auto">{pendingCount}</Badge>}</Button>
            </Link>
            <Link to="/project-dashboard">
              <Button variant="outline" className="w-full gap-2 justify-start"><FolderKanban size={16} />Project Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
