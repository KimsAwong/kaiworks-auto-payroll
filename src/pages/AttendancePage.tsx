import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAttendance,
  useClockIn,
  useClockOut,
} from "@/hooks/useAttendance";
import { useAttendanceNotifications } from "@/hooks/useAttendanceNotifications";
import { useRealtimeAttendance } from "@/hooks/useRealtimeAttendance";
import { usePayslipNotifications } from "@/hooks/usePayslipNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

export default function AttendancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useAttendance();
  const clockIn = useClockIn();
  const clockOut = useClockOut();

  useAttendanceNotifications();
  usePayslipNotifications();
  useRealtimeAttendance(() => {
    queryClient.invalidateQueries({ queryKey: ["attendance", user?.id] });
  });

  const openShift = useMemo(
    () => (data ?? []).find((row: any) => !row.clock_out),
    [data],
  );

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 py-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Clock In and Out</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full h-14 text-base sm:text-lg"
            disabled={!!openShift || clockIn.isPending}
            onClick={() => clockIn.mutate()}
          >
            {clockIn.isPending ? "Clocking in..." : "Clock In"}
          </Button>
          <Button
            variant="secondary"
            className="w-full h-14 text-base sm:text-lg"
            disabled={!openShift || clockOut.isPending}
            onClick={() => openShift && clockOut.mutate(openShift.id)}
          >
            {clockOut.isPending ? "Clocking out..." : "Clock Out"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">My Attendance History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          )}

          {!isLoading && (data?.length ?? 0) === 0 && (
            <div className="text-sm text-muted-foreground py-4">No attendance records yet.</div>
          )}

          {(data ?? []).map((row: any) => (
            <div
              key={row.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border px-3 py-2"
            >
              <div className="text-xs sm:text-sm">
                <div>In: {new Date(row.clock_in).toLocaleString()}</div>
                <div>Out: {row.clock_out ? new Date(row.clock_out).toLocaleString() : "-"}</div>
              </div>
              <Badge
                variant={
                  row.status === "approved"
                    ? "default"
                    : row.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
              >
                {row.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
