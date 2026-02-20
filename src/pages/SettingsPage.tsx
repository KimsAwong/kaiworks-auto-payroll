import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { user, roles, profile } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="page-header">Settings</h1>
      <Card>
        <CardHeader><CardTitle>Account Info</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium">{profile?.full_name ?? "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{user?.email ?? "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Roles</p>
            <div className="flex gap-1 mt-1">
              {roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
              {roles.length === 0 && <span className="text-muted-foreground text-sm">No roles assigned</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
