import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, FileText, DollarSign, ArrowRight, User, ClipboardList, Info, Mail, Phone, MapPin, Calendar, Briefcase, Edit, Building, Loader2, Save, X, Shield, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTimesheets } from "@/hooks/useTimesheets";
import { usePayslips } from "@/hooks/usePayslips";
import { useWorkSummaries, getCurrentFortnightPeriod } from "@/hooks/useWorkSummaries";
import { useProfile, useUpdateProfile, useBankDetails, useUpsertBankDetails } from "@/hooks/useProfile";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { mapErrorToUserMessage } from "@/lib/error-utils";
import { WorkSummarySection } from "@/components/workers/WorkSummarySection";
import type { Database } from "@/integrations/supabase/types";

// Sub-components
import WorkerOverviewTab from "./worker/WorkerOverviewTab";
import WorkerProfileTab from "./worker/WorkerProfileTab";
import WorkerBankTab from "./worker/WorkerBankTab";

export default function WorkerDashboard() {
  const { user, primaryRole, roles } = useAuth();
  const { data: timesheets, isLoading: loadingTimesheets } = useTimesheets();
  const { data: payslips } = usePayslips();
  const { data: summaries } = useWorkSummaries();
  const { data: profileData, isLoading: loadingProfile } = useProfile();
  type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
  const profile = profileData as ProfileRow | null;
  const { data: bankDetails } = useBankDetails();
  const { data: contracts } = useContracts(user?.id);
  const updateProfile = useUpdateProfile();
  const upsertBank = useUpsertBankDetails();
  const { toast } = useToast();

  const period = getCurrentFortnightPeriod();
  const hasSummaryThisPeriod = summaries?.some(
    (s: any) => s.period_start === period.start && s.period_end === period.end
  );

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const thisWeekHours = timesheets?.filter((t: any) => {
    const d = new Date(t.date);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    return d >= weekStart && t.status === 'approved';
  }).reduce((sum: number, t: any) => sum + Number(t.total_hours || 0), 0) || 0;

  const latestPayslip = payslips?.[0];
  const pendingCount = timesheets?.filter((t: any) => t.status === 'pending').length || 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loadingProfile || !profile) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?';

  return (
    <div className="space-y-6">
      {/* Header with avatar */}
      <div className="rounded-xl bg-gradient-primary p-6 text-primary-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary-foreground/30">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-xl bg-primary-foreground/20 text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">
                {greeting()}, {user?.full_name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-primary-foreground/80 mt-1">{currentDate}</p>
            </div>
          </div>
          <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 gap-1 self-start">
            <User size={14} /> Worker
          </Badge>
        </div>
      </div>

      {/* Fortnightly Summary Alert */}
      {!hasSummaryThisPeriod && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-sm">Fortnightly Summary Due</p>
                  <p className="text-xs text-muted-foreground">
                    Period: {new Date(period.start).toLocaleDateString()} – {new Date(period.end).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button size="sm" className="gap-1" onClick={() => document.getElementById('tab-summaries')?.click()}>
                <ClipboardList size={14} /> Submit Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Content: Overview, Profile, Bank, Summaries */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="bank">Bank Details</TabsTrigger>
          <TabsTrigger value="summaries" id="tab-summaries">Work Summaries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <WorkerOverviewTab
            thisWeekHours={thisWeekHours}
            latestPayslip={latestPayslip}
            timesheetCount={timesheets?.length || 0}
            pendingCount={pendingCount}
            user={user}
            primaryRole={primaryRole}
          />
        </TabsContent>

        <TabsContent value="profile">
          <WorkerProfileTab
            profile={profile}
            roles={roles}
            primaryRole={primaryRole}
            user={user}
            updateProfile={updateProfile}
            timesheets={timesheets}
            payslips={payslips}
            contracts={contracts}
          />
        </TabsContent>

        <TabsContent value="bank">
          <WorkerBankTab
            bankDetails={bankDetails}
            user={user}
            upsertBank={upsertBank}
          />
        </TabsContent>

        <TabsContent value="summaries">
          <WorkSummarySection showForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
