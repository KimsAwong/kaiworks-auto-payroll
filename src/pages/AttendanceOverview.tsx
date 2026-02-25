import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Eye } from 'lucide-react';

export default function AttendanceOverview() {
  const [viewEntry, setViewEntry] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timesheets')
        .select('*, worker:profiles!timesheets_worker_id_fkey(full_name, position, employment_type, email), supervisor:profiles!timesheets_supervisor_id_fkey(full_name)')
        .order('date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Attendance Overview</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Workers Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(data ?? []).map((a: any) => (
              <div key={a.id} className="flex justify-between items-center border-b py-2">
                <div>
                  <div className="font-medium">{a.worker?.full_name ?? 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.date} | {a.clock_in} — {a.clock_out}
                    {a.total_hours && ` (${a.total_hours}h)`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.status === 'approved' ? 'default' : a.status === 'pending' ? 'secondary' : 'destructive'}>
                    {a.status}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => setViewEntry(a)}>
                    <Eye size={16} className="mr-1" /> View
                  </Button>
                </div>
              </div>
            ))}
            {(data ?? []).length === 0 && <div className="text-muted-foreground text-sm">No attendance records yet.</div>}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!viewEntry} onOpenChange={() => setViewEntry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Attendance Record Details</DialogTitle>
          </DialogHeader>
          {viewEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Worker</p>
                  <p className="font-medium">{viewEntry.worker?.full_name ?? 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Position</p>
                  <p className="font-medium">{viewEntry.worker?.position ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Employment Type</p>
                  <Badge variant="outline">{viewEntry.worker?.employment_type ?? '—'}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{viewEntry.worker?.email ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Supervisor</p>
                  <p className="font-medium">{viewEntry.supervisor?.full_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{viewEntry.date}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Clock In</p>
                  <p className="font-medium">{viewEntry.clock_in}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Clock Out</p>
                  <p className="font-medium">{viewEntry.clock_out}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Hours</p>
                  <p className="font-medium">{viewEntry.total_hours ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={viewEntry.status === 'approved' ? 'default' : viewEntry.status === 'pending' ? 'secondary' : 'destructive'}>
                    {viewEntry.status}
                  </Badge>
                </div>
              </div>
              {viewEntry.task_description && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Task Description</p>
                  <p className="bg-muted/50 rounded p-3 mt-1">{viewEntry.task_description}</p>
                </div>
              )}
              {viewEntry.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Notes</p>
                  <p className="bg-muted/50 rounded p-3 mt-1">{viewEntry.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
