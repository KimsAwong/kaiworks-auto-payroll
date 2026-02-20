import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, Loader2, ClipboardCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteTimesheets, useUpdateSiteTimesheetStatus } from "@/hooks/useSiteTimesheets";
import { useToast } from "@/hooks/use-toast";
import { mapErrorToUserMessage } from "@/lib/error-utils";

const statusBadge = (status: string) => {
  switch (status) {
    case 'authorized': return <Badge className="bg-success">Authorized</Badge>;
    case 'submitted': return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
    case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
    default: return <Badge variant="outline">Draft</Badge>;
  }
};

export default function ClerkApprovalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: allTimesheets, isLoading } = useSiteTimesheets();
  const updateStatus = useUpdateSiteTimesheetStatus();
  const [selectedTs, setSelectedTs] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const pendingTimesheets = allTimesheets?.filter((t: any) => t.status === 'submitted') || [];
  const processedTimesheets = allTimesheets?.filter((t: any) => ['authorized', 'rejected'].includes(t.status)) || [];

  const handleAuthorize = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'authorized', clerkId: user?.id });
      toast({ title: "Timesheet authorized ✓" });
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    try {
      await updateStatus.mutateAsync({ id: rejectingId, status: 'rejected', clerkId: user?.id, rejectionReason });
      toast({ title: "Timesheet rejected" });
      setShowRejectDialog(false);
      setRejectingId(null);
      setRejectionReason('');
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Timesheet Authorization</h1>
        <p className="text-muted-foreground">Review and authorize site timesheets submitted by supervisors</p>
      </div>

      {/* Pending Queue */}
      <Card className={pendingTimesheets.length > 0 ? "border-warning/30" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-warning" />
            Pending Authorization ({pendingTimesheets.length})
          </CardTitle>
          <CardDescription>Timesheets awaiting your review — updates appear in realtime</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : pendingTimesheets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No timesheets pending authorization</p>
          ) : (
            <div className="space-y-3">
              {pendingTimesheets.map((ts: any) => (
                <div key={ts.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{ts.project?.name || 'Unknown Project'}</p>
                      <p className="text-xs text-muted-foreground">
                        {ts.foreman?.full_name || 'Unknown'} · {new Date(ts.date).toLocaleDateString()} · {ts.shift} shift · {ts.number_of_workers} workers
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedTs(ts)}>
                        <Eye size={14} className="mr-1" /> Details
                      </Button>
                      <Button size="sm" variant="ghost" className="text-success gap-1" onClick={() => handleAuthorize(ts.id)} disabled={updateStatus.isPending}>
                        <CheckCircle size={14} /> Authorize
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive gap-1" onClick={() => { setRejectingId(ts.id); setShowRejectDialog(true); }}>
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

      {/* Processed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Processed Timesheets ({processedTimesheets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Foreman</TableHead>
                  <TableHead>Workers</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedTimesheets.slice(0, 20).map((ts: any) => (
                  <TableRow key={ts.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedTs(ts)}>
                    <TableCell>{new Date(ts.date).toLocaleDateString()}</TableCell>
                    <TableCell>{ts.project?.name || '—'}</TableCell>
                    <TableCell>{ts.foreman?.full_name || '—'}</TableCell>
                    <TableCell>{ts.number_of_workers}</TableCell>
                    <TableCell>{statusBadge(ts.status)}</TableCell>
                  </TableRow>
                ))}
                {processedTimesheets.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No processed timesheets</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedTs} onOpenChange={() => setSelectedTs(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Timesheet Details</DialogTitle>
            <DialogDescription>{selectedTs?.project?.name} — {selectedTs?.date && new Date(selectedTs.date).toLocaleDateString()}</DialogDescription>
          </DialogHeader>
          {selectedTs && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Foreman:</span> {selectedTs.foreman?.full_name}</div>
                <div><span className="text-muted-foreground">Shift:</span> {selectedTs.shift}</div>
                <div><span className="text-muted-foreground">Workers:</span> {selectedTs.number_of_workers}</div>
                <div><span className="text-muted-foreground">Status:</span> {statusBadge(selectedTs.status)}</div>
              </div>

              {selectedTs.equipment?.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-1">Equipment</p>
                  <div className="bg-muted/50 rounded p-3 space-y-1">
                    {selectedTs.equipment.map((eq: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{eq.name}</span><span>{eq.hours_used}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTs.materials?.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-1">Materials</p>
                  <div className="bg-muted/50 rounded p-3 space-y-1">
                    {selectedTs.materials.map((m: any, i: number) => (
                      <div key={i} className="text-sm">
                        {m.item}: {m.quantity} {m.unit}
                        {m.calculated_kg > 0 && <span className="text-muted-foreground"> ({m.calculated_kg} kg)</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTs.production?.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-1">Production</p>
                  <div className="bg-muted/50 rounded p-3 space-y-1">
                    {selectedTs.production.map((p: any, i: number) => (
                      <div key={i} className="text-sm">{p.activity}: {p.quantity} {p.unit}</div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTs.remarks && (
                <div>
                  <p className="font-medium text-sm mb-1">Remarks</p>
                  <p className="text-sm bg-muted/50 rounded p-3">{selectedTs.remarks}</p>
                </div>
              )}

              {selectedTs.rejection_reason && (
                <div className="border-destructive/30 border rounded p-3">
                  <p className="font-medium text-sm text-destructive mb-1">Rejection Reason</p>
                  <p className="text-sm">{selectedTs.rejection_reason}</p>
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
              <Button variant="destructive" onClick={handleReject} disabled={updateStatus.isPending || !rejectionReason.trim()}>
                {updateStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
