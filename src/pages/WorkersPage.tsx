import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, Loader2, Eye, ClipboardList, Info, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAllProfiles } from "@/hooks/useProfile";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { mapErrorToUserMessage } from "@/lib/error-utils";
import { PendingApprovals } from "@/components/workers/PendingApprovals";
import { WorkerDetailPanel } from "@/components/workers/WorkerDetailPanel";
import { WorkSummarySection } from "@/components/workers/WorkSummarySection";
import { useAllWorkSummaries, useReviewWorkSummary, getCurrentFortnightPeriod } from "@/hooks/useWorkSummaries";

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved': return <Badge className="bg-success">Active</Badge>;
    case 'pending': return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
    case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

function WorkersTable({
  workers,
  isLoading,
  selectedWorkerId,
  onSelectWorker,
}: {
  workers: any[];
  isLoading: boolean;
  selectedWorkerId: string | null;
  onSelectWorker: (id: string | null) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.map((worker: any) => (
            <TableRow key={worker.id} className={selectedWorkerId === worker.id ? 'bg-muted' : ''}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={worker.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {worker.full_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{worker.full_name}</p>
                    <p className="text-xs text-muted-foreground">{worker.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{worker.position || '—'}</TableCell>
              <TableCell>K {Number(worker.hourly_rate || 0).toFixed(2)}</TableCell>
              <TableCell>{getStatusBadge(worker.account_status)}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectWorker(selectedWorkerId === worker.id ? null : worker.id)}
                >
                  <Eye size={16} className="mr-1" /> View
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {workers.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No workers found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/** Shows all fortnightly summaries for supervisors/managers to review */
function FortnightlySummaryReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: allSummaries, isLoading } = useAllWorkSummaries();
  const reviewSummary = useReviewWorkSummary();
  const period = getCurrentFortnightPeriod();

  const handleReview = async (summaryId: string, status: string) => {
    if (!user) return;
    try {
      await reviewSummary.mutateAsync({ id: summaryId, status, reviewedBy: user.id });
      toast({ title: `Summary ${status}` });
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const getSummaryStatusBadge = (status: string) => {
    switch (status) {
      case 'reviewed': return <Badge className="bg-success">Reviewed</Badge>;
      case 'flagged': return <Badge className="bg-warning text-warning-foreground">Flagged</Badge>;
      default: return <Badge variant="secondary">Submitted</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const submitted = allSummaries?.filter((s: any) => s.status === 'submitted') || [];
  const reviewed = allSummaries?.filter((s: any) => s.status !== 'submitted') || [];

  return (
    <div className="space-y-4">
      {/* Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Workers submit fortnightly work summaries describing their tasks, challenges, and site work. 
              Current period: <strong>{new Date(period.start).toLocaleDateString()} – {new Date(period.end).toLocaleDateString()}</strong>. 
              Summaries reset automatically at the start of each new fortnight.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Review */}
      {submitted.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-warning" />
              Pending Review ({submitted.length})
            </CardTitle>
            <CardDescription>Summaries awaiting your review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {submitted.map((s: any) => (
              <div key={s.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s.worker?.full_name || 'Unknown Worker'}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.worker?.position || 'No position'} · {new Date(s.period_start).toLocaleDateString()} – {new Date(s.period_end).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 text-success gap-1" onClick={() => handleReview(s.id, 'reviewed')}>
                      <CheckCircle size={14} /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-warning gap-1" onClick={() => handleReview(s.id, 'flagged')}>
                      <AlertCircle size={14} /> Flag
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/50 rounded p-3 text-sm">{s.summary}</div>
                {s.tasks_completed && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Tasks Completed:</p>
                    <p className="text-sm">{s.tasks_completed}</p>
                  </div>
                )}
                {s.challenges && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Challenges:</p>
                    <p className="text-sm">{s.challenges}</p>
                  </div>
                )}
                {s.next_period_goals && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Next Period Goals:</p>
                    <p className="text-sm">{s.next_period_goals}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Previously Reviewed */}
      {reviewed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              Reviewed Summaries ({reviewed.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewed.slice(0, 10).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{s.worker?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.period_start).toLocaleDateString()} – {new Date(s.period_end).toLocaleDateString()}
                  </p>
                </div>
                {getSummaryStatusBadge(s.status)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(!allSummaries || allSummaries.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No work summaries submitted yet
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function WorkersPage() {
  const { primaryRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  const { data: profilesData, isLoading } = useAllProfiles();
  type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
  const profiles = profilesData as ProfileRow[] | null;

  const isAdmin = ['ceo', 'manager'].includes(primaryRole);
  const isSupervisor = primaryRole === 'supervisor';

  const filterWorkers = (type: 'permanent' | 'temporary') =>
    profiles?.filter((w: any) => {
      const matchesSearch = w.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.position?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = w.employment_type === type;
      return matchesSearch && matchesType;
    }) || [];

  const permanentWorkers = filterWorkers('permanent');
  const temporaryWorkers = filterWorkers('temporary');
  const selectedWorker = (profiles as ProfileRow[] | null)?.find((p: ProfileRow) => p.id === selectedWorkerId) || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            {isSupervisor ? 'My Team' : 'Workers'}
          </h1>
          <p className="text-muted-foreground">
            {isSupervisor 
              ? 'Manage your assigned workers, review summaries, and approve accounts' 
              : 'Manage your workforce, review fortnightly summaries, and track employment'}
          </p>
        </div>
      </div>

      {/* Pending Approvals */}
      {(isAdmin || isSupervisor) && <PendingApprovals />}

      {/* Main Tabs: Workers | Fortnightly Summaries */}
      <Tabs defaultValue="workers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workers" className="gap-2">
            <Users size={16} /> Workers
          </TabsTrigger>
          {(isAdmin || isSupervisor) && (
            <TabsTrigger value="summaries" className="gap-2">
              <ClipboardList size={16} /> Fortnightly Summaries
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="workers" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Search workers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>

          {/* Permanent / Temporary Tabs */}
          <Tabs defaultValue="permanent" className="space-y-4">
            <TabsList>
              <TabsTrigger value="permanent" className="gap-2">
                <Users size={16} /> Permanent ({permanentWorkers.length})
              </TabsTrigger>
              <TabsTrigger value="temporary" className="gap-2">
                <Users size={16} /> Temporary ({temporaryWorkers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="permanent">
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className={selectedWorkerId && selectedWorker?.employment_type === 'permanent' ? "lg:col-span-2" : "lg:col-span-3"}>
                  <CardContent className="pt-6">
                    <WorkersTable
                      workers={permanentWorkers}
                      isLoading={isLoading}
                      selectedWorkerId={selectedWorkerId}
                      onSelectWorker={setSelectedWorkerId}
                    />
                  </CardContent>
                </Card>
                {selectedWorkerId && selectedWorker?.employment_type === 'permanent' && (
                  <div className="space-y-4">
                    <WorkerDetailPanel worker={selectedWorker} workerId={selectedWorkerId} />
                    <WorkSummarySection workerId={selectedWorkerId} />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="temporary">
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className={selectedWorkerId && selectedWorker?.employment_type === 'temporary' ? "lg:col-span-2" : "lg:col-span-3"}>
                  <CardContent className="pt-6">
                    <WorkersTable
                      workers={temporaryWorkers}
                      isLoading={isLoading}
                      selectedWorkerId={selectedWorkerId}
                      onSelectWorker={setSelectedWorkerId}
                    />
                  </CardContent>
                </Card>
                {selectedWorkerId && selectedWorker?.employment_type === 'temporary' && (
                  <div className="space-y-4">
                    <WorkerDetailPanel worker={selectedWorker} workerId={selectedWorkerId} />
                    <WorkSummarySection workerId={selectedWorkerId} />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Fortnightly Summaries Tab */}
        {(isAdmin || isSupervisor) && (
          <TabsContent value="summaries">
            <FortnightlySummaryReview />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
