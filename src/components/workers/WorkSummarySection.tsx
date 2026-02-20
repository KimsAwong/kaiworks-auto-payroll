import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkSummaries, useCreateWorkSummary, useReviewWorkSummary, getCurrentFortnightPeriod } from "@/hooks/useWorkSummaries";
import { useToast } from "@/hooks/use-toast";
import { mapErrorToUserMessage } from "@/lib/error-utils";

interface WorkSummarySectionProps {
  workerId?: string;
  showForm?: boolean;
}

export function WorkSummarySection({ workerId, showForm = false }: WorkSummarySectionProps) {
  const { user, primaryRole } = useAuth();
  const { toast } = useToast();
  const id = workerId || user?.id;
  const { data: summaries, isLoading } = useWorkSummaries(id);
  const createSummary = useCreateWorkSummary();
  const reviewSummary = useReviewWorkSummary();
  const isSupervisorOrAbove = ['supervisor', 'manager', 'ceo'].includes(primaryRole);

  const [summaryText, setSummaryText] = useState('');
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [challenges, setChallenges] = useState('');
  const [goals, setGoals] = useState('');

  const period = getCurrentFortnightPeriod();

  // Check if already submitted for current period
  const alreadySubmitted = summaries?.some(
    (s: any) => s.period_start === period.start && s.period_end === period.end
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createSummary.mutateAsync({
        worker_id: user.id,
        period_start: period.start,
        period_end: period.end,
        summary: summaryText,
        tasks_completed: tasksCompleted,
        challenges,
        next_period_goals: goals,
      });
      toast({ title: "Work summary submitted!" });
      setSummaryText('');
      setTasksCompleted('');
      setChallenges('');
      setGoals('');
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const handleReview = async (summaryId: string, status: string) => {
    if (!user) return;
    try {
      await reviewSummary.mutateAsync({ id: summaryId, status, reviewedBy: user.id });
      toast({ title: `Summary ${status}` });
    } catch (err: any) {
      toast({ title: "Error", description: mapErrorToUserMessage(err), variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reviewed': return <Badge className="bg-success">Reviewed</Badge>;
      case 'flagged': return <Badge className="bg-warning text-warning-foreground">Flagged</Badge>;
      default: return <Badge variant="secondary">Submitted</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Submit Form - only for workers */}
      {showForm && !isSupervisorOrAbove && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Fortnightly Work Summary
            </CardTitle>
            <CardDescription>
              Current period: {new Date(period.start).toLocaleDateString()} – {new Date(period.end).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alreadySubmitted ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-success" />
                <p className="font-medium">Summary submitted for this period</p>
                <p className="text-sm mt-1">The next period will begin on {new Date(period.end).toLocaleDateString()}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Work Summary *</Label>
                  <Textarea
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    placeholder="Describe the work you completed during this fortnight..."
                    rows={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tasks Completed</Label>
                  <Textarea
                    value={tasksCompleted}
                    onChange={(e) => setTasksCompleted(e.target.value)}
                    placeholder="List the key tasks you completed..."
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Challenges Faced</Label>
                    <Textarea
                      value={challenges}
                      onChange={(e) => setChallenges(e.target.value)}
                      placeholder="Any difficulties or blockers..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Goals for Next Period</Label>
                    <Textarea
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                      placeholder="What you plan to accomplish..."
                      rows={3}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full gap-2" disabled={createSummary.isPending}>
                  {createSummary.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}
                  Submit Summary
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summaries History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-primary" />
            Work Summaries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : summaries && summaries.length > 0 ? (
            <div className="space-y-4">
              {summaries.map((s: any) => (
                <div key={s.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {new Date(s.period_start).toLocaleDateString()} – {new Date(s.period_end).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(s.status)}
                      {isSupervisorOrAbove && s.status === 'submitted' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-success" onClick={() => handleReview(s.id, 'reviewed')}>
                            <CheckCircle size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-warning" onClick={() => handleReview(s.id, 'flagged')}>
                            <AlertCircle size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm">{s.summary}</p>
                  {s.tasks_completed && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Tasks Completed:</p>
                      <p className="text-sm">{s.tasks_completed}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-sm text-muted-foreground">No summaries yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
