import { useMemo } from "react";
import { usePayrollEntries } from "@/hooks/usePayrollEntries";
import { formatKina } from "@/lib/payroll-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function PayrollHistory() {
  const { data, isLoading } = usePayrollEntries();

  const grouped = useMemo(() => {
    const map = new Map<string, { gross: number; tax: number; net: number; status: string; count: number }>();
    for (const entry of data ?? []) {
      const key = `${entry.period_start}|${entry.period_end}`;
      const current = map.get(key) ?? { gross: 0, tax: 0, net: 0, status: "draft", count: 0 };
      current.gross += Number(entry.gross_pay ?? 0);
      current.tax += Number(entry.deductions ?? 0);
      current.net += Number(entry.net_pay ?? 0);
      current.status = entry.status ?? current.status;
      current.count += 1;
      map.set(key, current);
    }
    return [...map.entries()].map(([period, value]) => {
      const [period_start, period_end] = period.split("|");
      return { period_start, period_end, ...value };
    });
  }, [data]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Payroll Cycle History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {!isLoading && grouped.length === 0 && (
            <div className="text-sm text-muted-foreground py-8">No payroll cycles yet.</div>
          )}

          {!isLoading && grouped.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.map((cycle) => (
                  <TableRow key={`${cycle.period_start}-${cycle.period_end}`}>
                    <TableCell>
                      {cycle.period_start} to {cycle.period_end}
                    </TableCell>
                    <TableCell>
                      <Badge>{cycle.status}</Badge>
                    </TableCell>
                    <TableCell>{cycle.count}</TableCell>
                    <TableCell>{formatKina(cycle.gross)}</TableCell>
                    <TableCell>{formatKina(cycle.tax)}</TableCell>
                    <TableCell className="font-medium">{formatKina(cycle.net)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
