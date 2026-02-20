import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatKina } from "@/lib/payroll-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function Employees() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("is_active", true).order("full_name");
    if (data) setEmployees(data);
  };

  useEffect(() => { load(); }, []);

  const filtered = employees.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Employees</h1>
          <p className="page-subtitle">{employees.length} total employees</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search employees..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Department</TableHead>
              <TableHead className="hidden md:table-cell">Position</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">{emp.full_name}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{emp.department ?? "—"}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{emp.position ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{emp.employment_type}</Badge>
                </TableCell>
                <TableCell>{formatKina(Number(emp.hourly_rate ?? 0))}/hr</TableCell>
                <TableCell>
                  <Badge variant={emp.account_status === "approved" ? "default" : "secondary"}>
                    {emp.account_status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No employees found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
