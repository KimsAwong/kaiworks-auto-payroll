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
import { PendingApprovals } from "@/components/workers/PendingApprovals";
import { WorkerDetailPanel } from "@/components/workers/WorkerDetailPanel";
import { WorkSummarySection } from "@/components/workers/WorkSummarySection";
import { useAllWorkSummaries, useReviewWorkSummary, getCurrentFortnightPeriod } from "@/hooks/useWorkSummaries";
import { useToast } from "@/hooks/use-toast";
import { mapErrorToUserMessage } from "@/lib/error-utils";

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved': return <Badge className="bg-success">Active</Badge>;
    case 'pending': return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
    case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export default function SupervisorTeamTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState('workers');

  const { data: profilesData, isLoading } = useAllProfiles();
  const { data: allSummaries, isLoading: loadingSummaries } = useAllWorkSummaries();
  const reviewSummary = useReviewWorkSummary();
  const period = getCurrentFortnightPeriod();

  const profiles = profilesData || [];

  const filteredWorkers = profiles.filter((w: any) => {
    const matchesSearch = w.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.position?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const selectedWorker = profiles.find((p: any) => p.id === selectedWorkerId) || null;

  const handleReview = async (summaryId: string, status: string) => {
    if (!user) return;
    try {
      await reviewSummary.mutateAsync({ id: summaryId, status, reviewedBy: user.id });
      toast({ title: `Summary ${status}` });
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const submitted = allSummaries?.filter((s: any) => s.status === 'submitted') || [];
  const reviewed = allSummaries?.filter((s: any) => s.status !== 'submitted') || [];

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      <PendingApprovals />

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="workers" className="gap-2">
            <Users size={16} /> Workers ({filteredWorkers.length})
          </TabsTrigger>
          <TabsTrigger value="summaries" className="gap-2">
            <ClipboardList size={16} /> Fortnightly Summaries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workers" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Search workers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className={selectedWorkerId ? "lg:col-span-2" : "lg:col-span-3"}>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWorkers.map((worker: any) => (
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
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{worker.employment_type}</Badge>
                            </TableCell>
                            <TableCell>K {Number(worker.hourly_rate || 0).toFixed(2)}</TableCell>
                            <TableCell>{getStatusBadge(worker.account_status)}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedWorkerId(selectedWorkerId === worker.id ? null : worker.id)}
                              >
                                <Eye size={16} className="mr-1" /> View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredWorkers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No workers found</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            {selectedWorkerId && selectedWorker && (
              <div className="space-y-4">
                <WorkerDetailPanel worker={selectedWorker} workerId={selectedWorkerId} />
                <WorkSummarySection workerId={selectedWorkerId} />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="summaries" className="space-y-4">
          {/* Info */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Workers submit fortnightly work summaries describing their tasks, challenges, and site work.
                  Current period: <strong>{new Date(period.start).toLocaleDateString()} – {new Date(period.end).toLocaleDateString()}</strong>.
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
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Reviewed */}
          {reviewed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Reviewed ({reviewed.length})
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
                    <Badge className={s.status === 'reviewed' ? 'bg-success' : 'bg-warning text-warning-foreground'}>
                      {s.status === 'reviewed' ? 'Reviewed' : 'Flagged'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(!allSummaries || allSummaries.length === 0) && !loadingSummaries && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No work summaries submitted yet
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
