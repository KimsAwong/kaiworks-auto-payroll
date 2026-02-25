import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, LayoutDashboard, Users, Clock, UserCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SupervisorOverviewTab from "./supervisor/SupervisorOverviewTab";
import SupervisorTeamTab from "./supervisor/SupervisorTeamTab";
import SupervisorTimesheetTab from "./supervisor/SupervisorTimesheetTab";
import SupervisorProfileTab from "./supervisor/SupervisorProfileTab";

export default function SupervisorDashboard() {
  const { user } = useAuth();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

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
              Supervisor Dashboard — Team management & time tracking
            </p>
          </div>
          <Badge className="bg-sidebar-accent text-sidebar-accent-foreground border-0 gap-1 self-start">
            <Eye size={14} /> Supervisor
          </Badge>
        </div>
      </div>

      {/* Tabbed Portal */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard size={16} /> Overview
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users size={16} /> My Team
          </TabsTrigger>
          <TabsTrigger value="timesheets" className="gap-2">
            <Clock size={16} /> Timesheets
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <UserCircle size={16} /> My Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SupervisorOverviewTab />
        </TabsContent>

        <TabsContent value="team">
          <SupervisorTeamTab />
        </TabsContent>

        <TabsContent value="timesheets">
          <SupervisorTimesheetTab />
        </TabsContent>

        <TabsContent value="profile">
          <SupervisorProfileTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
