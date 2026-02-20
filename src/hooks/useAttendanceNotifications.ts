import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAttendanceNotifications() {
  const { user } = useAuth();
  const lastStatus = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('attendance').on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'attendance', filter: `worker_id=eq.${user.id}` },
      (payload) => {
        const newStatus = payload.new.status;
        if (lastStatus.current && newStatus !== lastStatus.current) {
          if (newStatus === 'approved') {
            toast.success('Attendance approved', {
              description: 'Your supervisor approved your attendance record.',
            });
          } else if (newStatus === 'rejected') {
            toast.error('Attendance rejected', {
              description: 'Your supervisor rejected your attendance record.',
            });
          }
        }
        lastStatus.current = newStatus;
      }
    ).subscribe();
    return () => { channel.unsubscribe(); };
  }, [user?.id]);
}
