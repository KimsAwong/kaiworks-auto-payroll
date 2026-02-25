import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { usePayrollCycles } from "@/hooks/usePayrollCycles";
import { formatKina } from "@/lib/payroll-engine";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  verification: "bg-accent/20 text-accent-foreground",
  pending_approval: "bg-primary/15 text-primary",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paid: "bg-green-200 text-green-900 dark:bg-green-800/40 dark:text-green-300",
};

export default function PayrollRunsTab() {
  const { data: cycles, isLoading } = usePayrollCycles();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Payroll Runs</CardTitle>
      </CardHeader>
      <CardContent>
        {!cycles?.length ? (
          <p className="text-muted-foreground text-center py-8">No payroll runs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Workers</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.map(cycle => (
                  <TableRow key={cycle.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {cycle.period_start} → {cycle.period_end}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[cycle.status] || ""}>
                        {cycle.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{cycle.total_workers}</TableCell>
                    <TableCell className="text-right">{formatKina(cycle.total_gross)}</TableCell>
                    <TableCell className="text-right">{formatKina(cycle.total_deductions)}</TableCell>
                    <TableCell className="text-right font-bold">{formatKina(cycle.total_net)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(cycle.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
