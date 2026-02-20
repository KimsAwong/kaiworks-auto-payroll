import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, XCircle, UserCheck, Trash2, Loader2 } from "lucide-react";
import { usePendingApprovals, useApproveAccount } from "@/hooks/useAccountApprovals";
import { useToast } from "@/hooks/use-toast";
import { mapErrorToUserMessage } from "@/lib/error-utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function PendingApprovals() {
  const { data: pendingApprovals } = usePendingApprovals();
  const approveAccount = useApproveAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!pendingApprovals || pendingApprovals.length === 0) return null;

  const handleApproval = async (approvalId: string, userId: string, status: 'approved' | 'rejected') => {
    try {
      await approveAccount.mutateAsync({ approvalId, userId, status });
      toast({ title: `Account ${status}` });
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const handleDeleteAccount = async (userId: string) => {
    setDeletingId(userId);
    try {
      // Delete profile (cascades to related records)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (error) throw error;
      toast({ title: "Account deleted permanently" });
      queryClient.invalidateQueries({ queryKey: ['account-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    } catch (err: any) {
      toast({ title: "Error deleting account", description: mapErrorToUserMessage(err), variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="border-warning/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-warning" />
          Pending Account Approvals ({pendingApprovals.length})
        </CardTitle>
        <CardDescription>Review and approve new worker registrations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingApprovals.map((approval: any) => (
            <div key={approval.id} className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-warning/20 text-warning">
                    {(approval.user as any)?.full_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{(approval.user as any)?.full_name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">
                    {(approval.user as any)?.email} • {(approval.user as any)?.phone}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requested: {new Date(approval.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-success gap-1"
                  onClick={() => handleApproval(approval.id, approval.user_id, 'approved')}
                  disabled={approveAccount.isPending}
                >
                  <CheckCircle size={14} /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1"
                  onClick={() => handleApproval(approval.id, approval.user_id, 'rejected')}
                  disabled={approveAccount.isPending}
                >
                  <XCircle size={14} /> Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => handleDeleteAccount(approval.user_id)}
                  disabled={deletingId === approval.user_id}
                >
                  {deletingId === approval.user_id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
