import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Send, Loader2, ClipboardList, Trash2, HardHat, Package, Activity, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteTimesheets, useCreateSiteTimesheet } from "@/hooks/useSiteTimesheets";
import { useMyProjectAssignments } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";
import { mapErrorToUserMessage } from "@/lib/error-utils";

const statusBadge = (status: string) => {
  switch (status) {
    case 'authorized': return <Badge className="bg-success">Authorized</Badge>;
    case 'submitted': return <Badge variant="secondary">Submitted</Badge>;
    case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
    default: return <Badge variant="outline">Draft</Badge>;
  }
};

interface EquipmentItem { name: string; hours_used: number }
interface MaterialItem { item: string; quantity: number; unit: string; calculated_kg: number; notes: string }
interface ProductionItem { activity: string; quantity: number; unit: string }

export default function SiteTimesheetsPage() {
  const { user, isClerk } = useAuth();
  const { toast } = useToast();
  const { data: assignments } = useMyProjectAssignments();
  // Clerks see all timesheets; supervisors see only their own
  const { data: timesheets, isLoading } = useSiteTimesheets(isClerk ? undefined : { foremanId: user?.id });
  const createTimesheet = useCreateSiteTimesheet();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<any>(null);
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState('morning');
  const [numWorkers, setNumWorkers] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [production, setProduction] = useState<ProductionItem[]>([]);

  const addEquipment = () => setEquipment([...equipment, { name: '', hours_used: 0 }]);
  const addMaterial = () => setMaterials([...materials, { item: '', quantity: 0, unit: 'bags', calculated_kg: 0, notes: '' }]);
  const addProduction = () => setProduction([...production, { activity: '', quantity: 0, unit: 'm³' }]);

  const updateEquipment = (i: number, field: string, value: any) => {
    const copy = [...equipment];
    (copy[i] as any)[field] = value;
    setEquipment(copy);
  };

  const updateMaterial = (i: number, field: string, value: any) => {
    const copy = [...materials];
    (copy[i] as any)[field] = value;
    // Auto-calc kg for cement
    if (field === 'quantity' && copy[i].item.toLowerCase().includes('cement')) {
      copy[i].calculated_kg = Number(value) * 50; // 50kg per bag standard
      copy[i].notes = '50kg per bag';
    }
    setMaterials(copy);
  };

  const updateProduction = (i: number, field: string, value: any) => {
    const copy = [...production];
    (copy[i] as any)[field] = value;
    setProduction(copy);
  };

  const resetForm = () => {
    setProjectId('');
    setDate(new Date().toISOString().split('T')[0]);
    setShift('morning');
    setNumWorkers(0);
    setRemarks('');
    setEquipment([]);
    setMaterials([]);
    setProduction([]);
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (!user || !projectId) return;
    try {
      await createTimesheet.mutateAsync({
        project_id: projectId,
        foreman_id: user.id,
        date,
        shift,
        number_of_workers: numWorkers,
        equipment,
        materials,
        production,
        remarks: remarks || undefined,
        status: asDraft ? 'draft' : 'submitted',
      });
      toast({ title: asDraft ? "Draft saved" : "Timesheet submitted for authorization" });
      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const myProjects = assignments?.map((a: any) => a.project) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Site Timesheets</h1>
          <p className="text-muted-foreground">
            {isClerk
              ? "All submitted site timesheets from supervisors — go to Authorize Timesheets to approve/reject"
              : "Record daily site work — equipment, materials, production & workers"}
          </p>
        </div>
        {!isClerk && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus size={18} /> New Site Timesheet</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Site Timesheet</DialogTitle>
              <DialogDescription>Record daily work activity for your project site</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {myProjects.length === 0 && <SelectItem value="none" disabled>No projects assigned</SelectItem>}
                      {myProjects.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Shift</Label>
                  <Select value={shift} onValueChange={setShift}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Number of Workers</Label>
                  <Input type="number" min={0} value={numWorkers} onChange={e => setNumWorkers(Number(e.target.value))} />
                </div>
              </div>

              {/* Equipment */}
              <Tabs defaultValue="equipment">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="equipment" className="gap-1"><HardHat size={14} /> Equipment</TabsTrigger>
                  <TabsTrigger value="materials" className="gap-1"><Package size={14} /> Materials</TabsTrigger>
                  <TabsTrigger value="production" className="gap-1"><Activity size={14} /> Production</TabsTrigger>
                </TabsList>

                <TabsContent value="equipment" className="space-y-3 mt-4">
                  {equipment.map((eq, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Equipment Name</Label>
                        <Input placeholder="e.g. Excavator" value={eq.name} onChange={e => updateEquipment(i, 'name', e.target.value)} />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">Hours</Label>
                        <Input type="number" step="0.5" value={eq.hours_used} onChange={e => updateEquipment(i, 'hours_used', Number(e.target.value))} />
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive h-10 w-10" onClick={() => setEquipment(equipment.filter((_, j) => j !== i))}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addEquipment} className="gap-1"><Plus size={14} /> Add Equipment</Button>
                </TabsContent>

                <TabsContent value="materials" className="space-y-3 mt-4">
                  {materials.map((mat, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-2">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Item</Label>
                          <Input placeholder="e.g. Cement" value={mat.item} onChange={e => updateMaterial(i, 'item', e.target.value)} />
                        </div>
                        <div className="w-20 space-y-1">
                          <Label className="text-xs">Qty</Label>
                          <Input type="number" value={mat.quantity} onChange={e => updateMaterial(i, 'quantity', Number(e.target.value))} />
                        </div>
                        <div className="w-24 space-y-1">
                          <Label className="text-xs">Unit</Label>
                          <Select value={mat.unit} onValueChange={v => updateMaterial(i, 'unit', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bags">Bags</SelectItem>
                              <SelectItem value="kg">Kg</SelectItem>
                              <SelectItem value="liters">Liters</SelectItem>
                              <SelectItem value="pieces">Pieces</SelectItem>
                              <SelectItem value="meters">Meters</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive h-10 w-10" onClick={() => setMaterials(materials.filter((_, j) => j !== i))}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      {mat.calculated_kg > 0 && (
                        <p className="text-xs text-muted-foreground">Auto-calculated: {mat.calculated_kg} kg ({mat.notes})</p>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addMaterial} className="gap-1"><Plus size={14} /> Add Material</Button>
                </TabsContent>

                <TabsContent value="production" className="space-y-3 mt-4">
                  {production.map((prod, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Activity</Label>
                        <Input placeholder="e.g. Soil compaction" value={prod.activity} onChange={e => updateProduction(i, 'activity', e.target.value)} />
                      </div>
                      <div className="w-20 space-y-1">
                        <Label className="text-xs">Qty</Label>
                        <Input type="number" step="0.1" value={prod.quantity} onChange={e => updateProduction(i, 'quantity', Number(e.target.value))} />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">Unit</Label>
                        <Select value={prod.unit} onValueChange={v => updateProduction(i, 'unit', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="m³">m³</SelectItem>
                            <SelectItem value="m²">m²</SelectItem>
                            <SelectItem value="m">m</SelectItem>
                            <SelectItem value="units">Units</SelectItem>
                            <SelectItem value="tonnes">Tonnes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive h-10 w-10" onClick={() => setProduction(production.filter((_, j) => j !== i))}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addProduction} className="gap-1"><Plus size={14} /> Add Production</Button>
                </TabsContent>
              </Tabs>

              {/* Remarks */}
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea placeholder="e.g. 50X cement bags used, production low due to rain..." value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => handleSubmit(true)} disabled={createTimesheet.isPending || !projectId}>
                  Save as Draft
                </Button>
                <Button onClick={() => handleSubmit(false)} disabled={createTimesheet.isPending || !projectId} className="gap-2">
                  {createTimesheet.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}
                  Submit for Authorization
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Timesheets List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            My Site Timesheets
          </CardTitle>
          <CardDescription>{isClerk ? "All site timesheets submitted by supervisors" : "All timesheets you've submitted for your assigned projects"}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Workers</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(timesheets || []).map((ts: any) => (
                      <TableRow key={ts.id}>
                        <TableCell>{new Date(ts.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{ts.project?.name || '—'}</TableCell>
                        <TableCell className="capitalize">{ts.shift || '—'}</TableCell>
                        <TableCell>{ts.number_of_workers}</TableCell>
                        <TableCell>{statusBadge(ts.status)}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {ts.remarks || '—'}
                          {ts.rejection_reason && <span className="block text-destructive text-xs">Reason: {ts.rejection_reason}</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setViewEntry(ts)}>
                            <Eye size={14} /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!timesheets || timesheets.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No site timesheets yet. Create your first one!</TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={!!viewEntry} onOpenChange={(open) => { if (!open) setViewEntry(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Site Timesheet Details</DialogTitle>
            <DialogDescription>
              {viewEntry?.project?.name} — {viewEntry ? new Date(viewEntry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
            </DialogDescription>
          </DialogHeader>
          {viewEntry && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  {statusBadge(viewEntry.status)}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Shift</p>
                  <p className="font-medium capitalize">{viewEntry.shift || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Workers</p>
                  <p className="font-medium">{viewEntry.number_of_workers}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Foreman</p>
                  <p className="font-medium">{viewEntry.foreman?.full_name || '—'}</p>
                </div>
              </div>

              {viewEntry.rejection_reason && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                  <p className="text-sm text-destructive/80">{viewEntry.rejection_reason}</p>
                </div>
              )}

              {/* Equipment */}
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><HardHat size={16} className="text-primary" /> Equipment</h4>
                {(viewEntry.equipment as any[])?.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Hours Used</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {(viewEntry.equipment as any[]).map((eq: any, i: number) => (
                        <TableRow key={i}><TableCell>{eq.name}</TableCell><TableCell>{eq.hours_used}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-sm text-muted-foreground">No equipment recorded</p>}
              </div>

              {/* Materials */}
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><Package size={16} className="text-primary" /> Materials</h4>
                {(viewEntry.materials as any[])?.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Unit</TableHead><TableHead>Calc. Kg</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {(viewEntry.materials as any[]).map((mat: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{mat.item}</TableCell>
                          <TableCell>{mat.quantity}</TableCell>
                          <TableCell>{mat.unit}</TableCell>
                          <TableCell>{mat.calculated_kg > 0 ? mat.calculated_kg : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-sm text-muted-foreground">No materials recorded</p>}
              </div>

              {/* Production */}
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><Activity size={16} className="text-primary" /> Production</h4>
                {(viewEntry.production as any[])?.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>Activity</TableHead><TableHead>Qty</TableHead><TableHead>Unit</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {(viewEntry.production as any[]).map((prod: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{prod.activity}</TableCell>
                          <TableCell>{prod.quantity}</TableCell>
                          <TableCell>{prod.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-sm text-muted-foreground">No production recorded</p>}
              </div>

              {/* Remarks */}
              {viewEntry.remarks && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Remarks</h4>
                  <p className="text-sm text-muted-foreground">{viewEntry.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
