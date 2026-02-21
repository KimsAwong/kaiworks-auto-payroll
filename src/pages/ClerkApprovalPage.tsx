import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Eye, Loader2, ClipboardCheck, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteTimesheets, useUpdateSiteTimesheetStatus } from "@/hooks/useSiteTimesheets";
import { useTimesheets, useUpdateTimesheetStatus } from "@/hooks/useTimesheets";
import { useToast } from "@/hooks/use-toast";
import { mapErrorToUserMessage } from "@/lib/error-utils";

const siteStatusBadge = (status: string) => {
  switch (status) {
    case 'authorized': return <Badge className="bg-success">Authorized</Badge>;
    case 'submitted': return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
    case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
    default: return <Badge variant="outline">Draft</Badge>;
  }
};

const workerStatusBadge = (status: string) => {
  switch (status) {
    case 'approved': return <Badge className="bg-success">Approved</Badge>;
    case 'pending': return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
    case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
    case 'flagged': return <Badge variant="secondary">Flagged</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export default function ClerkApprovalPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Site timesheets
  const { data: allSiteTimesheets, isLoading: loadingSite } = useSiteTimesheets();
  const updateSiteStatus = useUpdateSiteTimesheetStatus();
  const [selectedSiteTs, setSelectedSiteTs] = useState<any>(null);

  // Worker timesheets
  const { data: allWorkerTimesheets, isLoading: loadingWorker } = useTimesheets();
  const updateWorkerStatus = useUpdateTimesheetStatus();

  // Reject dialog state
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectingType, setRejectingType] = useState<'site' | 'worker'>('site');

  // Site timesheet lists
  const pendingSiteTimesheets = allSiteTimesheets?.filter((t: any) => t.status === 'submitted') || [];
  const processedSiteTimesheets = allSiteTimesheets?.filter((t: any) => ['authorized', 'rejected'].includes(t.status)) || [];

  // Worker timesheet lists
  const pendingWorkerTimesheets = (allWorkerTimesheets as any[])?.filter((t: any) => t.status === 'pending') || [];
  const processedWorkerTimesheets = (allWorkerTimesheets as any[])?.filter((t: any) => ['approved', 'rejected', 'flagged'].includes(t.status)) || [];

  const handleAuthorizeSite = async (id: string) => {
    try {
      await updateSiteStatus.mutateAsync({ id, status: 'authorized', clerkId: user?.id });
      toast({ title: "Site timesheet authorized ✓" });
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const handleApproveWorker = async (id: string) => {
    try {
      await updateWorkerStatus.mutateAsync({ id, status: 'approved', approvedBy: user?.id });
      toast({ title: "Worker timesheet approved ✓" });
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const openRejectDialog = (id: string, type: 'site' | 'worker') => {
    setRejectingId(id);
    setRejectingType(type);
    setShowRejectDialog(true);
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    try {
      if (rejectingType === 'site') {
        await updateSiteStatus.mutateAsync({ id: rejectingId, status: 'rejected', clerkId: user?.id, rejectionReason });
      } else {
        await updateWorkerStatus.mutateAsync({ id: rejectingId, status: 'rejected' });
      }
      toast({ title: "Timesheet rejected" });
      setShowRejectDialog(false);
      setRejectingId(null);
      setRejectionReason('');
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const totalPending = pendingSiteTimesheets.length + pendingWorkerTimesheets.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Timesheet Authorization</h1>
        <p className="text-muted-foreground">Review and approve all timesheets — {totalPending} pending</p>
      </div>

      <Tabs defaultValue="site" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="site" className="gap-2">
            <ClipboardCheck size={16} /> Site Timesheets ({pendingSiteTimesheets.length})
          </TabsTrigger>
          <TabsTrigger value="worker" className="gap-2">
            <Clock size={16} /> Worker Timesheets ({pendingWorkerTimesheets.length})
          </TabsTrigger>
        </TabsList>

        {/* Site Timesheets Tab */}
        <TabsContent value="site" className="space-y-4">
          <Card className={pendingSiteTimesheets.length > 0 ? "border-warning/30" : ""}>
            <CardHeader>
              <CardTitle className="text-base">Pending Site Timesheets ({pendingSiteTimesheets.length})</CardTitle>
              <CardDescription>Site timesheets submitted by supervisors</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSite ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : pendingSiteTimesheets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No site timesheets pending</p>
              ) : (
                <div className="space-y-3">
                  {pendingSiteTimesheets.map((ts: any) => (
                    <div key={ts.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{ts.project?.name || 'Unknown Project'}</p>
                          <p className="text-xs text-muted-foreground">
                            {ts.foreman?.full_name || 'Unknown'} · {new Date(ts.date).toLocaleDateString()} · {ts.shift} shift · {ts.number_of_workers} workers
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedSiteTs(ts)}><Eye size={14} className="mr-1" /> Details</Button>
                          <Button size="sm" variant="ghost" className="text-success gap-1" onClick={() => handleAuthorizeSite(ts.id)} disabled={updateSiteStatus.isPending}>
                            <CheckCircle size={14} /> Authorize
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive gap-1" onClick={() => openRejectDialog(ts.id, 'site')}>
                            <XCircle size={14} /> Reject
                          </Button>
                        </div>
                      </div>
                      {ts.remarks && <p className="text-sm bg-muted/50 rounded p-2">{ts.remarks}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processed site timesheets */}
          <Card>
            <CardHeader><CardTitle className="text-base">Processed Site Timesheets ({processedSiteTimesheets.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead><TableHead>Project</TableHead><TableHead>Foreman</TableHead><TableHead>Workers</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedSiteTimesheets.slice(0, 20).map((ts: any) => (
                      <TableRow key={ts.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedSiteTs(ts)}>
                        <TableCell>{new Date(ts.date).toLocaleDateString()}</TableCell>
                        <TableCell>{ts.project?.name || '—'}</TableCell>
                        <TableCell>{ts.foreman?.full_name || '—'}</TableCell>
                        <TableCell>{ts.number_of_workers}</TableCell>
                        <TableCell>{siteStatusBadge(ts.status)}</TableCell>
                      </TableRow>
                    ))}
                    {processedSiteTimesheets.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No processed site timesheets</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Worker Timesheets Tab */}
        <TabsContent value="worker" className="space-y-4">
          <Card className={pendingWorkerTimesheets.length > 0 ? "border-warning/30" : ""}>
            <CardHeader>
              <CardTitle className="text-base">Pending Worker Timesheets ({pendingWorkerTimesheets.length})</CardTitle>
              <CardDescription>Individual worker hours recorded by supervisors</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWorker ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : pendingWorkerTimesheets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No worker timesheets pending</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Worker</TableHead><TableHead>Date</TableHead><TableHead>Clock In</TableHead><TableHead>Clock Out</TableHead><TableHead>Hours</TableHead><TableHead>Task</TableHead><TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingWorkerTimesheets.map((ts: any) => (
                        <TableRow key={ts.id}>
                          <TableCell className="font-medium">{ts.worker?.full_name || '—'}</TableCell>
                          <TableCell>{new Date(ts.date).toLocaleDateString()}</TableCell>
                          <TableCell>{ts.clock_in}</TableCell>
                          <TableCell>{ts.clock_out}</TableCell>
                          <TableCell>{Number(ts.total_hours || 0).toFixed(1)}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{ts.task_description || '—'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="text-success gap-1" onClick={() => handleApproveWorker(ts.id)} disabled={updateWorkerStatus.isPending}>
                                <CheckCircle size={14} /> Approve
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive gap-1" onClick={() => openRejectDialog(ts.id, 'worker')}>
                                <XCircle size={14} /> Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processed worker timesheets */}
          <Card>
            <CardHeader><CardTitle className="text-base">Processed Worker Timesheets ({processedWorkerTimesheets.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead><TableHead>Date</TableHead><TableHead>Hours</TableHead><TableHead>Task</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedWorkerTimesheets.slice(0, 20).map((ts: any) => (
                      <TableRow key={ts.id}>
                        <TableCell className="font-medium">{ts.worker?.full_name || '—'}</TableCell>
                        <TableCell>{new Date(ts.date).toLocaleDateString()}</TableCell>
                        <TableCell>{Number(ts.total_hours || 0).toFixed(1)}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{ts.task_description || '—'}</TableCell>
                        <TableCell>{workerStatusBadge(ts.status)}</TableCell>
                      </TableRow>
                    ))}
                    {processedWorkerTimesheets.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No processed worker timesheets</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Site Detail Dialog */}
      <Dialog open={!!selectedSiteTs} onOpenChange={() => setSelectedSiteTs(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Site Timesheet Details</DialogTitle>
            <DialogDescription>{selectedSiteTs?.project?.name} — {selectedSiteTs?.date && new Date(selectedSiteTs.date).toLocaleDateString()}</DialogDescription>
          </DialogHeader>
          {selectedSiteTs && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Foreman:</span> {selectedSiteTs.foreman?.full_name}</div>
                <div><span className="text-muted-foreground">Shift:</span> {selectedSiteTs.shift}</div>
                <div><span className="text-muted-foreground">Workers:</span> {selectedSiteTs.number_of_workers}</div>
                <div><span className="text-muted-foreground">Status:</span> {siteStatusBadge(selectedSiteTs.status)}</div>
              </div>
              {selectedSiteTs.equipment?.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-1">Equipment</p>
                  <div className="bg-muted/50 rounded p-3 space-y-1">
                    {selectedSiteTs.equipment.map((eq: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm"><span>{eq.name}</span><span>{eq.hours_used}h</span></div>
                    ))}
                  </div>
                </div>
              )}
              {selectedSiteTs.materials?.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-1">Materials</p>
                  <div className="bg-muted/50 rounded p-3 space-y-1">
                    {selectedSiteTs.materials.map((m: any, i: number) => (
                      <div key={i} className="text-sm">{m.item}: {m.quantity} {m.unit}{m.calculated_kg > 0 && <span className="text-muted-foreground"> ({m.calculated_kg} kg)</span>}</div>
                    ))}
                  </div>
                </div>
              )}
              {selectedSiteTs.production?.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-1">Production</p>
                  <div className="bg-muted/50 rounded p-3 space-y-1">
                    {selectedSiteTs.production.map((p: any, i: number) => (
                      <div key={i} className="text-sm">{p.activity}: {p.quantity} {p.unit}</div>
                    ))}
                  </div>
                </div>
              )}
              {selectedSiteTs.remarks && (
                <div><p className="font-medium text-sm mb-1">Remarks</p><p className="text-sm bg-muted/50 rounded p-3">{selectedSiteTs.remarks}</p></div>
              )}
              {selectedSiteTs.rejection_reason && (
                <div className="border-destructive/30 border rounded p-3">
                  <p className="font-medium text-sm text-destructive mb-1">Rejection Reason</p>
                  <p className="text-sm">{selectedSiteTs.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Timesheet</DialogTitle>
            <DialogDescription>Provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea placeholder="Reason for rejection..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={3} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectingId(null); }}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={(updateSiteStatus.isPending || updateWorkerStatus.isPending) || !rejectionReason.trim()}>
                {(updateSiteStatus.isPending || updateWorkerStatus.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
