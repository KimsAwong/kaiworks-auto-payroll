import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Calendar, Send, CheckCircle2, AlertCircle, XCircle, Loader2, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTimesheets, useCreateTimesheet, useUpdateTimesheetStatus } from "@/hooks/useTimesheets";
import type { Database } from "@/integrations/supabase/types";
import { useAllProfiles } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { mapErrorToUserMessage } from "@/lib/error-utils";

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-success"><CheckCircle2 size={14} className="mr-1" />Approved</Badge>;
    case 'pending':
      return <Badge variant="secondary"><Clock size={14} className="mr-1" />Pending</Badge>;
    case 'flagged':
      return <Badge className="bg-warning text-warning-foreground"><AlertCircle size={14} className="mr-1" />Flagged</Badge>;
    case 'rejected':
      return <Badge variant="destructive"><XCircle size={14} className="mr-1" />Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function TimesheetPage() {
  const { user, primaryRole } = useAuth();
  const { toast } = useToast();
  const isSupervisorOrAbove = ['supervisor', 'ceo'].includes(primaryRole);

  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading: loadingTimesheets } = useTimesheets();
  type TimesheetRow = Database["public"]["Tables"]["timesheets"]["Row"];
  const timesheets = data as TimesheetRow[] | null;
  const { data: allProfilesData } = useAllProfiles();
  type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
  const allProfiles = allProfilesData as ProfileRow[] | null;
  const createTimesheet = useCreateTimesheet();
  const updateStatus = useUpdateTimesheetStatus();

  // Get workers: for supervisors show their assigned workers + all if manager/ceo
  const assignedWorkers = Array.isArray(allProfiles)
    ? (allProfiles as ProfileRow[]).filter(p => {
        if (primaryRole === 'ceo') return p.id !== user?.id;
        if (primaryRole === 'supervisor') return p.supervisor_id === user?.id;
        return false;
      })
    : [];

  const calculateHours = () => {
    if (!clockIn || !clockOut) return 0;
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    const diff = ((outH * 60 + outM) - (inH * 60 + inM)) / 60;
    return diff > 0 ? diff : 0;
  };

  const hours = calculateHours();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const workerId = isSupervisorOrAbove ? selectedWorkerId : user.id;
    if (!workerId) {
      toast({ title: "Please select a worker", variant: "destructive" });
      return;
    }

    if (hours <= 0) {
      toast({ title: "Clock out must be after clock in", variant: "destructive" });
      return;
    }

    try {
      await createTimesheet.mutateAsync({
        worker_id: workerId,
        supervisor_id: user.id,
        date,
        clock_in: clockIn,
        clock_out: clockOut,
        task_description: taskDescription,
      });
      toast({ title: "Timesheet submitted successfully" });
      setClockIn('');
      setClockOut('');
      setTaskDescription('');
      setSelectedWorkerId('');
    } catch (err: any) {
      toast({ title: "Error submitting timesheet", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status, approvedBy: user?.id });
      toast({ title: `Timesheet ${status}` });
    } catch (err: any) {
      toast({ title: "Error updating timesheet", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const filteredTimesheets = timesheets?.filter((t: any) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Timesheets</h1>
        <p className="text-muted-foreground">
          {isSupervisorOrAbove ? "Enter clock-in/out times for workers and approve timesheets" : "View your work hours entered by your supervisor"}
        </p>
      </div>

      {/* Info Banner for Workers */}
      {!isSupervisorOrAbove && (
        <Card className="bg-muted/50 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Your timesheets are managed by your supervisor</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your supervisor enters your clock-in and clock-out times. Once approved, your payslip is automatically generated.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Entry Form - only for supervisors+ */}
        {isSupervisorOrAbove && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Enter Time
              </CardTitle>
              <CardDescription>Record clock-in/out for a worker</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Worker</Label>
                  <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                    <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                    <SelectContent>
                      {assignedWorkers.length === 0 ? (
                        <SelectItem value="none" disabled>No workers assigned</SelectItem>
                      ) : (
                        assignedWorkers.map(w => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.full_name} {w.position ? `- ${w.position}` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Clock In</Label>
                    <Input type="time" value={clockIn} onChange={(e) => setClockIn(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Clock Out</Label>
                    <Input type="time" value={clockOut} onChange={(e) => setClockOut(e.target.value)} required />
                  </div>
                </div>

                {hours > 0 && (
                  <div className="p-4 rounded-lg bg-primary/10 text-center">
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-3xl font-bold text-primary">{hours.toFixed(1)}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Task Description</Label>
                  <Textarea
                    placeholder="What did the worker do today?"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full gap-2" disabled={createTimesheet.isPending || !selectedWorkerId}>
                  {createTimesheet.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}
                  Submit Timesheet
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Timesheets List */}
        <Card className={isSupervisorOrAbove ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {isSupervisorOrAbove ? "All Timesheets" : "My Timesheets"}
                </CardTitle>
                <CardDescription>
                  {isSupervisorOrAbove ? "Review and approve worker timesheets" : "Your submitted work hours"}
                </CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter size={14} className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTimesheets ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isSupervisorOrAbove && <TableHead>Worker</TableHead>}
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Status</TableHead>
                      {isSupervisorOrAbove && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTimesheets.map((entry: any) => (
                      <TableRow key={entry.id}>
                        {isSupervisorOrAbove && (
                          <TableCell className="font-medium">{entry.worker?.full_name || '—'}</TableCell>
                        )}
                        <TableCell>
                          {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell>{entry.clock_in}</TableCell>
                        <TableCell>{entry.clock_out}</TableCell>
                        <TableCell>{Number(entry.total_hours || 0).toFixed(1)}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{entry.task_description || '—'}</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        {isSupervisorOrAbove && (
                          <TableCell>
                            {entry.status === 'pending' ? (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="text-success h-8 w-8 p-0" onClick={() => handleStatusUpdate(entry.id, 'approved')} title="Approve">
                                  <CheckCircle2 size={16} />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-warning h-8 w-8 p-0" onClick={() => handleStatusUpdate(entry.id, 'flagged')} title="Flag">
                                  <AlertCircle size={16} />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-destructive h-8 w-8 p-0" onClick={() => handleStatusUpdate(entry.id, 'rejected')} title="Reject">
                                  <XCircle size={16} />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {filteredTimesheets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={isSupervisorOrAbove ? 8 : 6} className="text-center py-8 text-muted-foreground">
                          No timesheets found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
