import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeAttendance(onChange: () => void) {
  useEffect(() => {
    const channel = supabase.channel('timesheets-realtime').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'timesheets' },
      () => onChange()
    ).subscribe();
    return () => { channel.unsubscribe(); };
  }, [onChange]);
}
