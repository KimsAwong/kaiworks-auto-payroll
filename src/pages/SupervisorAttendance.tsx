import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useReviewAttendance, useTeamAttendance } from "@/hooks/useAttendance";

export default function SupervisorAttendance() {
  const { data, isLoading } = useTeamAttendance();
  const reviewAttendance = useReviewAttendance();
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [clockInById, setClockInById] = useState<Record<string, string>>({});
  const [clockOutById, setClockOutById] = useState<Record<string, string>>({});

  const pending = (data ?? []).filter((row: any) => row.status === "pending");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pending Team Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          )}

          {!isLoading && pending.length === 0 && (
            <div className="text-sm text-muted-foreground">No pending attendance records.</div>
          )}

          {pending.map((row: any) => (
            <div key={row.id} className="rounded-lg border p-3 space-y-2">
              <div className="text-sm font-medium">{row.worker?.full_name ?? "Worker"}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  type="datetime-local"
                  value={clockInById[row.id] ?? (row.clock_in ? row.clock_in.slice(0, 16) : "")}
                  onChange={(event) =>
                    setClockInById((prev) => ({ ...prev, [row.id]: event.target.value }))
                  }
                />
                <Input
                  type="datetime-local"
                  value={clockOutById[row.id] ?? (row.clock_out ? row.clock_out.slice(0, 16) : "")}
                  onChange={(event) =>
                    setClockOutById((prev) => ({ ...prev, [row.id]: event.target.value }))
                  }
                />
              </div>
              <Textarea
                placeholder="Approval/rejection notes"
                value={notesById[row.id] ?? ""}
                onChange={(event) =>
                  setNotesById((prev) => ({ ...prev, [row.id]: event.target.value }))
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    reviewAttendance.mutate({
                      timesheet_id: row.id,
                      status: "approved",
                      notes: notesById[row.id] ?? undefined,
                    })
                  }
                  disabled={reviewAttendance.isPending}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    reviewAttendance.mutate({
                      timesheet_id: row.id,
                      status: "rejected",
                      notes: notesById[row.id] ?? undefined,
                    })
                  }
                  disabled={reviewAttendance.isPending}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Team Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data ?? []).map((row: any) => (
            <div key={row.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div className="text-xs sm:text-sm">
                <div className="font-medium">{row.worker?.full_name ?? "Worker"}</div>
                <div>
                  {row.clock_in ? new Date(row.clock_in).toLocaleString() : "-"} to{" "}
                  {row.clock_out ? new Date(row.clock_out).toLocaleString() : "-"}
                </div>
              </div>
              <Badge>{row.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
