import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mapErrorToUserMessage } from "@/lib/error-utils";

interface WorkerBankTabProps {
  bankDetails: any;
  user: any;
  upsertBank: any;
}

export default function WorkerBankTab({ bankDetails, user, upsertBank }: WorkerBankTabProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    bank_name: '', branch: '', account_name: '', account_number: '', bsb_code: '', swift_code: '',
  });

  const handleEdit = () => {
    if (bankDetails) {
      setForm({
        bank_name: bankDetails.bank_name || '', branch: bankDetails.branch || '',
        account_name: bankDetails.account_name || '', account_number: bankDetails.account_number || '',
        bsb_code: bankDetails.bsb_code || '', swift_code: bankDetails.swift_code || '',
      });
    }
    setEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      await upsertBank.mutateAsync({ userId: user.id, details: form });
      toast({ title: "Bank details saved" });
      setEditing(false);
    } catch (err: any) {
      toast({ title: "Error saving bank details", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5 text-primary" /> Bank Details</CardTitle>
            <CardDescription>Your bank account for salary payments</CardDescription>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit size={16} className="mr-2" /> {bankDetails ? 'Edit' : 'Add'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input value={form.bank_name} onChange={(e) => setForm(prev => ({ ...prev, bank_name: e.target.value }))} placeholder="BSP, Kina Bank..." />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Input value={form.branch} onChange={(e) => setForm(prev => ({ ...prev, branch: e.target.value }))} placeholder="Port Moresby" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input value={form.account_name} onChange={(e) => setForm(prev => ({ ...prev, account_name: e.target.value }))} placeholder="Full account name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input value={form.account_number} onChange={(e) => setForm(prev => ({ ...prev, account_number: e.target.value }))} placeholder="XXXX XXXX XXXX" />
              </div>
              <div className="space-y-2">
                <Label>Swift Code</Label>
                <Input value={form.swift_code} onChange={(e) => setForm(prev => ({ ...prev, swift_code: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={upsertBank.isPending} className="gap-2">
                <Save size={16} /> {upsertBank.isPending ? 'Saving...' : 'Save Bank Details'}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)} className="gap-2"><X size={16} /> Cancel</Button>
            </div>
          </div>
        ) : bankDetails ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div><p className="text-sm text-muted-foreground">Bank</p><p className="font-medium">{bankDetails.bank_name || '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Branch</p><p className="font-medium">{bankDetails.branch || '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Account Name</p><p className="font-medium">{bankDetails.account_name || '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Account Number</p><p className="font-medium">{'•••• ' + (bankDetails.account_number?.slice(-4) || '—')}</p></div>
            {bankDetails.swift_code && (
              <div><p className="text-sm text-muted-foreground">Swift Code</p><p className="font-medium">{bankDetails.swift_code}</p></div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No bank details added yet.</p>
            <p className="text-sm mt-1">Add your bank details so your supervisor can process payments.</p>
            <Button variant="outline" className="mt-4" onClick={handleEdit}>Add Bank Details</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
