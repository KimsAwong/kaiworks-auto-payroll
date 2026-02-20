import { useMemo } from "react";
import { usePayrollEntries } from "@/hooks/usePayrollEntries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function PaymentHistoryPage() {
  const { data, isLoading } = usePayrollEntries();

  const paidEntries = useMemo(
    () => (data ?? []).filter((entry: any) => entry.status === "paid"),
    [data],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Payment History</h1>
        <p className="text-sm text-muted-foreground">All completed payroll payments.</p>
      </div>

      {paidEntries.length === 0 && (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">
            No payment history yet.
          </CardContent>
        </Card>
      )}

      {paidEntries.map((entry: any) => (
        <Card key={entry.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>
                {entry.period_start} to {entry.period_end}
              </span>
              <Badge>Paid</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <span>Net: K {Number(entry.net_pay ?? 0).toFixed(2)}</span>
            <span>Deductions: K {Number(entry.deductions ?? 0).toFixed(2)}</span>
            <span>
              Paid at: {entry.paid_at ? new Date(entry.paid_at).toLocaleString() : "-"}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
