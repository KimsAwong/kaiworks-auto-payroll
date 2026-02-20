import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileSignature, Plus, Loader2, AlertTriangle, Calendar, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useContracts, useCreateContract, useDeactivateContract } from "@/hooks/useContracts";
import { useAllProfiles } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { mapErrorToUserMessage } from "@/lib/error-utils";

export default function ContractsPage() {
  const { user, primaryRole } = useAuth();
  const { toast } = useToast();
  const isAdmin = ['ceo', 'manager'].includes(primaryRole);
  const { data: contracts, isLoading } = useContracts();
  const { data: profiles } = useAllProfiles();
  const createContract = useCreateContract();
  const deactivateContract = useDeactivateContract();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    worker_id: '',
    start_date: '',
    end_date: '',
    description: '',
    hourly_rate: '',
    daily_rate: '',
  });

  const temporaryWorkers = profiles?.filter((p: any) => p.employment_type === 'temporary') || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createContract.mutateAsync({
        worker_id: form.worker_id,
        start_date: form.start_date,
        end_date: form.end_date,
        description: form.description || undefined,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : undefined,
        daily_rate: form.daily_rate ? parseFloat(form.daily_rate) : undefined,
        approved_by: user.id,
      });
      toast({ title: "Contract created successfully" });
      setDialogOpen(false);
      setForm({ worker_id: '', start_date: '', end_date: '', description: '', hourly_rate: '', daily_rate: '' });
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateContract.mutateAsync(id);
      toast({ title: "Contract deactivated" });
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();
  const isExpiringSoon = (endDate: string) => {
    const daysLeft = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= 14;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Contract Management</h1>
          <p className="text-muted-foreground">Manage temporary worker contracts and agreements</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus size={18} /> New Contract</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Contract</DialogTitle>
                <DialogDescription>Set up a new contract for a temporary worker</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Worker</Label>
                  <Select value={form.worker_id} onValueChange={(v) => setForm(p => ({ ...p, worker_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                    <SelectContent>
                      {temporaryWorkers.map((w: any) => (
                        <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>
                      ))}
                      {temporaryWorkers.length === 0 && (
                        <SelectItem value="none" disabled>No temporary workers</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={form.start_date} onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={form.end_date} onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hourly Rate (K)</Label>
                    <Input type="number" step="0.01" value={form.hourly_rate} onChange={(e) => setForm(p => ({ ...p, hourly_rate: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Daily Rate (K)</Label>
                    <Input type="number" step="0.01" value={form.daily_rate} onChange={(e) => setForm(p => ({ ...p, daily_rate: e.target.value }))} placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Contract details..." rows={3} />
                </div>
                <Button type="submit" className="w-full" disabled={createContract.isPending || !form.worker_id}>
                  {createContract.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Contract
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Expiring Soon Alerts */}
      {contracts?.some((c: any) => c.is_active && isExpiringSoon(c.end_date)) && (
        <Card className="border-warning/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium">Contracts Expiring Soon</p>
                <p className="text-sm text-muted-foreground">
                  {contracts.filter((c: any) => c.is_active && isExpiringSoon(c.end_date)).length} contract(s) will expire within 14 days.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            All Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                    <TableHead>Daily Rate</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts?.map((contract: any) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.worker?.full_name || '—'}
                      </TableCell>
                      <TableCell>{new Date(contract.start_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(contract.end_date).toLocaleDateString()}</TableCell>
                      <TableCell>K {Number(contract.hourly_rate || 0).toFixed(2)}</TableCell>
                      <TableCell>K {Number(contract.daily_rate || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {!contract.is_active ? (
                          <Badge variant="secondary">Inactive</Badge>
                        ) : isExpired(contract.end_date) ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : isExpiringSoon(contract.end_date) ? (
                          <Badge className="bg-warning text-warning-foreground">Expiring Soon</Badge>
                        ) : (
                          <Badge className="bg-success">Active</Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {contract.is_active && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDeactivate(contract.id)}
                            >
                              <XCircle size={14} className="mr-1" /> Deactivate
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {(!contracts || contracts.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                        No contracts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
