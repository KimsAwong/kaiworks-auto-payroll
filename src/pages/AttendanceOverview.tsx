import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function AttendanceOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['attendance-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timesheets')
        .select('*, worker:profiles!timesheets_worker_id_fkey(full_name)')
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
                <Badge variant={a.status === 'approved' ? 'default' : a.status === 'pending' ? 'secondary' : 'destructive'}>
                  {a.status}
                </Badge>
              </div>
            ))}
            {(data ?? []).length === 0 && <div className="text-muted-foreground text-sm">No attendance records yet.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
