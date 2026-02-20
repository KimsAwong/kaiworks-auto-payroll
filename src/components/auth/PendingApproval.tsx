import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Clock, Shield, LogOut } from "lucide-react";

export function PendingApproval() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        
        <Card className="border-warning/30">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="text-warning" size={32} />
            </div>
            <CardTitle className="font-display text-2xl">Account Pending Approval</CardTitle>
            <CardDescription>
              Your account has been created and is awaiting approval from your supervisor or manager.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">What happens next?</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Your supervisor or manager will review your account</li>
                <li>Once approved, you'll have full access to WorkFlow PNG</li>
                <li>You'll be notified when your account is activated</li>
              </ul>
            </div>

            {user && (
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="text-muted-foreground">Signed in as:</p>
                <p className="font-medium">{user.full_name}</p>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            )}

            <Button variant="outline" className="w-full gap-2" onClick={signOut}>
              <LogOut size={16} />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
