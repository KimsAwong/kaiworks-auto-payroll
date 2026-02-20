import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, MapPin, Calendar, Briefcase, Edit, Building, Loader2, Save, X, Shield, Users, BarChart3, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile, useBankDetails, useUpsertBankDetails } from "@/hooks/useProfile";
import type { Database } from "@/integrations/supabase/types";
import { useTimesheets } from "@/hooks/useTimesheets";
import { usePayslips } from "@/hooks/usePayslips";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { mapErrorToUserMessage } from "@/lib/error-utils";
import { WorkSummarySection } from "@/components/workers/WorkSummarySection";

export default function ProfilePage() {
  const { user, primaryRole, roles } = useAuth();
  const { data, isLoading } = useProfile();
  type ProfileRow = import("@/integrations/supabase/types").Database["public"]["Tables"]["profiles"]["Row"];
  const profile = data as ProfileRow | null;
  const { data: bankDetails } = useBankDetails();
  const { data: timesheets } = useTimesheets();
  const { data: payslips } = usePayslips();
  const { data: contracts } = useContracts(user?.id);
  const updateProfile = useUpdateProfile();
  const upsertBank = useUpsertBankDetails();
  const { toast } = useToast();

  const [editingProfile, setEditingProfile] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: '',
    location: '',
    position: '',
    department: '',
  });
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    branch: '',
    account_name: '',
    account_number: '',
    bsb_code: '',
    swift_code: '',
  });

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?';

  const totalHours = timesheets?.filter((t: any) => t.status === 'approved')
    .reduce((sum: number, t: any) => sum + Number(t.total_hours || 0), 0) || 0;

  const totalEarned = payslips?.filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + Number(p.net_pay || 0), 0) || 0;

  const activeContracts = contracts?.filter((c: any) => c.is_active && new Date(c.end_date) >= new Date()).length || 0;

  const handleEditProfile = () => {
    setProfileForm({
      phone: profile.phone || '',
      location: profile.location || '',
      position: profile.position || '',
      department: profile.department || '',
    });
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await updateProfile.mutateAsync({ id: user.id, updates: profileForm });
      toast({ title: "Profile updated" });
      setEditingProfile(false);
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const handleEditBank = () => {
    if (bankDetails) {
      setBankForm({
        bank_name: bankDetails.bank_name || '',
        branch: bankDetails.branch || '',
        account_name: bankDetails.account_name || '',
        account_number: bankDetails.account_number || '',
        bsb_code: bankDetails.bsb_code || '',
        swift_code: bankDetails.swift_code || '',
      });
    }
    setEditingBank(true);
  };

  const handleSaveBank = async () => {
    if (!user) return;
    try {
      await upsertBank.mutateAsync({ userId: user.id, details: bankForm });
      toast({ title: "Bank details saved" });
      setEditingBank(false);
    } catch (err: any) {
      toast({ title: "Error saving bank details", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ceo': return 'bg-accent text-accent-foreground';
      
      case 'supervisor': return 'bg-warning text-warning-foreground';
      
      default: return '';
    }
  };

  const getRoleDescription = () => {
    switch (primaryRole) {
      case 'ceo': return 'Full organizational visibility and management';
      
      case 'supervisor': return 'Team management, timesheets, and worker oversight';
      
      case 'worker': return 'Personal timesheets, payslips, and profile management';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-hero" />
        <CardContent className="relative pt-0">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-4xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold">{profile.full_name}</h1>
                  <p className="text-muted-foreground">{profile.position || 'Employee'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Shield size={16} className="text-primary" />
                    <Badge className={getRoleBadgeColor(primaryRole) + ' capitalize'}>{primaryRole}</Badge>
                    {roles.length > 1 && roles.filter(r => r !== primaryRole).map(r => (
                      <Badge key={r} variant="outline" className="capitalize">{r}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{getRoleDescription()}</p>
                </div>
                <Badge className={profile.account_status === 'approved' ? 'bg-success' : 'bg-warning text-warning-foreground'}>
                  {profile.account_status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-specific Stats */}
      <div className="grid gap-4 md:grid-cols-4">
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
        {profile.employment_type === 'temporary' && (
          <Card>
            <CardContent className="pt-6 text-center">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{activeContracts}</p>
              <p className="text-sm text-muted-foreground">Active Contracts</p>
            </CardContent>
          </Card>
        )}
        {profile.employment_type === 'permanent' && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{payslips?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total Payslips</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Personal Info</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="bank">Bank Details</TabsTrigger>
          {primaryRole === 'worker' && <TabsTrigger value="summaries">Work Summaries</TabsTrigger>}
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                {!editingProfile && (
                  <Button variant="outline" size="sm" onClick={handleEditProfile}>
                    <Edit size={16} className="mr-2" /> Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingProfile ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={profileForm.phone} onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input value={profileForm.location} onChange={(e) => setProfileForm(p => ({ ...p, location: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Input value={profileForm.position} onChange={(e) => setProfileForm(p => ({ ...p, position: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Input value={profileForm.department} onChange={(e) => setProfileForm(p => ({ ...p, department: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSaveProfile} disabled={updateProfile.isPending} className="gap-2">
                      <Save size={16} /> {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingProfile(false)} className="gap-2">
                      <X size={16} /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Mail className="text-primary" size={18} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{profile.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Phone className="text-primary" size={18} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{profile.phone || '—'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="text-primary" size={18} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{profile.location || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="text-primary" size={18} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Joined</p>
                        <p className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium text-lg">{profile.position || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{profile.department || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employment Type</p>
                  <Badge className="mt-1">{profile.employment_type}</Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                  <p className="font-medium">K {Number(profile.hourly_rate || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <div className="flex items-center gap-2 mt-1">
                    {roles.map(r => (
                      <Badge key={r} variant="outline" className="capitalize">{r}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className="mt-1 bg-success">{profile.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payslip History in Employment tab */}
          {payslips && payslips.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Recent Payslips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {payslips.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <span className="text-sm">
                        {new Date(p.period_start).toLocaleDateString()} – {new Date(p.period_end).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">K {Number(p.net_pay).toLocaleString()}</span>
                        <Badge variant={p.status === 'paid' ? 'default' : 'secondary'} className={p.status === 'paid' ? 'bg-success' : ''}>
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    Bank Details
                  </CardTitle>
                  <CardDescription>Your bank account for salary payments</CardDescription>
                </div>
                {!editingBank && (
                  <Button variant="outline" size="sm" onClick={handleEditBank}>
                    <Edit size={16} className="mr-2" />
                    {bankDetails ? 'Edit' : 'Add'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingBank ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input value={bankForm.bank_name} onChange={(e) => setBankForm(prev => ({ ...prev, bank_name: e.target.value }))} placeholder="BSP, Kina Bank..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <Input value={bankForm.branch} onChange={(e) => setBankForm(prev => ({ ...prev, branch: e.target.value }))} placeholder="Port Moresby" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Account Name</Label>
                    <Input value={bankForm.account_name} onChange={(e) => setBankForm(prev => ({ ...prev, account_name: e.target.value }))} placeholder="Full account name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input value={bankForm.account_number} onChange={(e) => setBankForm(prev => ({ ...prev, account_number: e.target.value }))} placeholder="XXXX XXXX XXXX" />
                    </div>
                    <div className="space-y-2">
                      <Label>Swift Code</Label>
                      <Input value={bankForm.swift_code} onChange={(e) => setBankForm(prev => ({ ...prev, swift_code: e.target.value }))} placeholder="Optional" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSaveBank} disabled={upsertBank.isPending} className="gap-2">
                      <Save size={16} /> {upsertBank.isPending ? 'Saving...' : 'Save Bank Details'}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingBank(false)} className="gap-2">
                      <X size={16} /> Cancel
                    </Button>
                  </div>
                </div>
              ) : bankDetails ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Bank</p>
                    <p className="font-medium">{bankDetails.bank_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Branch</p>
                    <p className="font-medium">{bankDetails.branch || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Name</p>
                    <p className="font-medium">{bankDetails.account_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="font-medium">{'•••• ' + (bankDetails.account_number?.slice(-4) || '—')}</p>
                  </div>
                  {bankDetails.swift_code && (
                    <div>
                      <p className="text-sm text-muted-foreground">Swift Code</p>
                      <p className="font-medium">{bankDetails.swift_code}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No bank details added yet.</p>
                  <p className="text-sm mt-1">Add your bank details so your supervisor can process payments.</p>
                  <Button variant="outline" className="mt-4" onClick={handleEditBank}>
                    Add Bank Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {primaryRole === 'worker' && (
          <TabsContent value="summaries">
            <WorkSummarySection showForm />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
