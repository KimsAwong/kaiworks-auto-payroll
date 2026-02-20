import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FolderKanban, Users, Package, Activity, HardHat } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useSiteTimesheets } from "@/hooks/useSiteTimesheets";

export default function ProjectDashboardPage() {
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: timesheets, isLoading: loadingTs } = useSiteTimesheets();

  const isLoading = loadingProjects || loadingTs;

  const projectSummaries = useMemo(() => {
    if (!projects || !timesheets) return [];
    return projects.map((project: any) => {
      const projectTs = timesheets.filter((t: any) => t.project_id === project.id && t.status === 'authorized');
      const totalWorkerDays = projectTs.reduce((s: number, t: any) => s + (t.number_of_workers || 0), 0);
      
      // Aggregate materials
      const materialMap = new Map<string, number>();
      projectTs.forEach((t: any) => {
        (t.materials || []).forEach((m: any) => {
          const key = `${m.item} (${m.unit})`;
          materialMap.set(key, (materialMap.get(key) || 0) + Number(m.quantity || 0));
        });
      });

      // Aggregate production
      const productionMap = new Map<string, number>();
      projectTs.forEach((t: any) => {
        (t.production || []).forEach((p: any) => {
          const key = `${p.activity} (${p.unit})`;
          productionMap.set(key, (productionMap.get(key) || 0) + Number(p.quantity || 0));
        });
      });

      // Aggregate equipment hours
      const equipmentMap = new Map<string, number>();
      projectTs.forEach((t: any) => {
        (t.equipment || []).forEach((e: any) => {
          equipmentMap.set(e.name, (equipmentMap.get(e.name) || 0) + Number(e.hours_used || 0));
        });
      });

      // Collect remarks
      const remarks = projectTs.filter((t: any) => t.remarks).map((t: any) => ({
        date: t.date,
        foreman: t.foreman?.full_name || 'Unknown',
        text: t.remarks,
      }));

      return {
        ...project,
        timesheetCount: projectTs.length,
        totalWorkerDays,
        materials: [...materialMap.entries()],
        production: [...productionMap.entries()],
        equipment: [...equipmentMap.entries()],
        remarks: remarks.slice(0, 5),
      };
    });
  }, [projects, timesheets]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Project Dashboard</h1>
        <p className="text-muted-foreground">Aggregated project summaries from authorized site timesheets</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{projects?.filter((p: any) => p.status === 'active').length || 0} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authorized Timesheets</CardTitle>
            <Activity className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timesheets?.filter((t: any) => t.status === 'authorized').length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Worker-Days</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projectSummaries.reduce((s, p) => s + p.totalWorkerDays, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Project Summaries */}
      {projectSummaries.map((project) => (
        <Card key={project.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-primary" />
                  {project.name}
                </CardTitle>
                <CardDescription>{project.location || 'No location'} · {project.timesheetCount} authorized timesheets</CardDescription>
              </div>
              <Badge className={project.status === 'active' ? 'bg-success' : project.status === 'on-hold' ? 'bg-warning text-warning-foreground' : ''}>
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Equipment */}
              <div>
                <p className="font-medium text-sm flex items-center gap-1 mb-2"><HardHat size={14} /> Equipment Usage</p>
                {project.equipment.length > 0 ? (
                  <div className="space-y-1">
                    {project.equipment.map(([name, hours]: [string, number]) => (
                      <div key={name} className="flex justify-between text-sm bg-muted/50 rounded px-3 py-1.5">
                        <span>{name}</span><span className="font-medium">{hours}h</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No equipment data</p>}
              </div>

              {/* Materials */}
              <div>
                <p className="font-medium text-sm flex items-center gap-1 mb-2"><Package size={14} /> Materials Used</p>
                {project.materials.length > 0 ? (
                  <div className="space-y-1">
                    {project.materials.map(([name, qty]: [string, number]) => (
                      <div key={name} className="flex justify-between text-sm bg-muted/50 rounded px-3 py-1.5">
                        <span>{name}</span><span className="font-medium">{qty}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No materials data</p>}
              </div>

              {/* Production */}
              <div>
                <p className="font-medium text-sm flex items-center gap-1 mb-2"><Activity size={14} /> Production Output</p>
                {project.production.length > 0 ? (
                  <div className="space-y-1">
                    {project.production.map(([name, qty]: [string, number]) => (
                      <div key={name} className="flex justify-between text-sm bg-muted/50 rounded px-3 py-1.5">
                        <span>{name}</span><span className="font-medium">{qty}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No production data</p>}
              </div>
            </div>

            {/* Recent Remarks */}
            {project.remarks.length > 0 && (
              <div className="mt-4">
                <p className="font-medium text-sm mb-2">Recent Remarks</p>
                <div className="space-y-2">
                  {project.remarks.map((r: any, i: number) => (
                    <div key={i} className="text-sm bg-muted/30 rounded p-3">
                      <span className="text-muted-foreground">{new Date(r.date).toLocaleDateString()} — {r.foreman}:</span> {r.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {projectSummaries.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No projects found</CardContent></Card>
      )}
    </div>
  );
}
