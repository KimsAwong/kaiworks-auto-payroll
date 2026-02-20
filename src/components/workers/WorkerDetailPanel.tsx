import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Loader2 } from "lucide-react";
import { useBankDetails } from "@/hooks/useProfile";

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved': return <Badge className="bg-success">Active</Badge>;
    case 'pending': return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
    case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

function WorkerBankDetails({ workerId }: { workerId: string }) {
  const { data: bankDetails, isLoading } = useBankDetails(workerId);

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
  if (!bankDetails) return <span className="text-muted-foreground text-sm">No bank details</span>;

  return (
    <div className="grid gap-3 md:grid-cols-2 text-sm">
      <div>
        <p className="text-muted-foreground">Bank</p>
        <p className="font-medium">{bankDetails.bank_name || '—'}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Branch</p>
        <p className="font-medium">{bankDetails.branch || '—'}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Account Name</p>
        <p className="font-medium">{bankDetails.account_name || '—'}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Account Number</p>
        <p className="font-medium">{bankDetails.account_number || '—'}</p>
      </div>
    </div>
  );
}

interface WorkerDetailPanelProps {
  worker: any;
  workerId: string;
}

export function WorkerDetailPanel({ worker, workerId }: WorkerDetailPanelProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={worker.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {worker.full_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{worker.full_name}</CardTitle>
            <CardDescription>{worker.position || 'No position'}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
            <TabsTrigger value="bank" className="flex-1">Bank</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-3">
            <div className="grid gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{worker.email || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{worker.phone || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Department</p>
                <p className="font-medium">{worker.department || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Employment Type</p>
                <Badge variant="outline">{worker.employment_type}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Hourly Rate</p>
                <p className="font-medium">K {Number(worker.hourly_rate || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{worker.location || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                {getStatusBadge(worker.account_status)}
              </div>
              <div>
                <p className="text-muted-foreground">Joined</p>
                <p className="font-medium">{new Date(worker.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bank">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Bank Details</span>
              </div>
              <WorkerBankDetails workerId={workerId} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
