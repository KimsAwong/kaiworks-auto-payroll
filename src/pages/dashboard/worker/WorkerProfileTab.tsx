import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Calendar, Briefcase, Edit, Save, X, Shield, BarChart3, Building, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mapErrorToUserMessage } from "@/lib/error-utils";

interface WorkerProfileTabProps {
  profile: any;
  roles: string[];
  primaryRole: string;
  user: any;
  updateProfile: any;
  timesheets: any;
  payslips: any;
  contracts: any;
}

export default function WorkerProfileTab({ profile, roles, primaryRole, user, updateProfile, timesheets, payslips, contracts }: WorkerProfileTabProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: '', location: '', position: '', department: '' });

  const totalHours = timesheets?.filter((t: any) => t.status === 'approved')
    .reduce((sum: number, t: any) => sum + Number(t.total_hours || 0), 0) || 0;
  const totalEarned = payslips?.filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + Number(p.net_pay || 0), 0) || 0;

  const handleEdit = () => {
    setForm({ phone: profile.phone || '', location: profile.location || '', position: profile.position || '', department: profile.department || '' });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateProfile.mutateAsync({ id: user.id, updates: form });
      toast({ title: "Profile updated" });
      setEditing(false);
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <Briefcase className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold capitalize">{primaryRole}</p>
            <p className="text-sm text-muted-foreground">Role</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{totalHours.toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">Total Hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Building className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">K {totalEarned.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Personal Information
            </CardTitle>
            {!editing && (
              <Button variant="outline" size="sm" onClick={handleEdit}><Edit size={16} className="mr-2" /> Edit</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input value={form.position} onChange={(e) => setForm(p => ({ ...p, position: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={form.department} onChange={(e) => setForm(p => ({ ...p, department: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={updateProfile.isPending} className="gap-2">
                  <Save size={16} /> {updateProfile.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)} className="gap-2"><X size={16} /> Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Mail className="text-primary" size={18} /></div>
                  <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{profile.email || '—'}</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Phone className="text-primary" size={18} /></div>
                  <div><p className="text-sm text-muted-foreground">Phone</p><p className="font-medium">{profile.phone || '—'}</p></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><MapPin className="text-primary" size={18} /></div>
                  <div><p className="text-sm text-muted-foreground">Location</p><p className="font-medium">{profile.location || '—'}</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Calendar className="text-primary" size={18} /></div>
                  <div><p className="text-sm text-muted-foreground">Joined</p><p className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</p></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Employment Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div><p className="text-sm text-muted-foreground">Position</p><p className="font-medium text-lg">{profile.position || '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Department</p><p className="font-medium">{profile.department || '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Employment Type</p><Badge className="mt-1">{profile.employment_type}</Badge></div>
          </div>
          <div className="space-y-4">
            <div><p className="text-sm text-muted-foreground">Hourly Rate</p><p className="font-medium">K {Number(profile.hourly_rate || 0).toFixed(2)}</p></div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <div className="flex items-center gap-2 mt-1">
                {roles.map(r => <Badge key={r} variant="outline" className="capitalize">{r}</Badge>)}
              </div>
            </div>
            <div><p className="text-sm text-muted-foreground">Status</p><Badge className="mt-1 bg-success">{profile.is_active ? 'Active' : 'Inactive'}</Badge></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
