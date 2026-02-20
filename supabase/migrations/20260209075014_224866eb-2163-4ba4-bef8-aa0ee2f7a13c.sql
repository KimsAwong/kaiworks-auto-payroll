
-- Work Summaries table for fortnightly uploads
CREATE TABLE public.work_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  summary TEXT NOT NULL,
  tasks_completed TEXT,
  challenges TEXT,
  next_period_goals TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'flagged')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_summaries ENABLE ROW LEVEL SECURITY;

-- Workers can view and create their own summaries
CREATE POLICY "Workers can view own summaries"
  ON public.work_summaries FOR SELECT
  USING (worker_id = auth.uid());

CREATE POLICY "Workers can create own summaries"
  ON public.work_summaries FOR INSERT
  WITH CHECK (worker_id = auth.uid());

-- Supervisors can view and review assigned workers' summaries
CREATE POLICY "Supervisors can view assigned workers summaries"
  ON public.work_summaries FOR SELECT
  USING (has_role(auth.uid(), 'supervisor') AND is_supervisor_of(auth.uid(), worker_id));

CREATE POLICY "Supervisors can update assigned workers summaries"
  ON public.work_summaries FOR UPDATE
  USING (has_role(auth.uid(), 'supervisor') AND is_supervisor_of(auth.uid(), worker_id));

-- Admins can manage all summaries
CREATE POLICY "Admins can manage all summaries"
  ON public.work_summaries FOR ALL
  USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_work_summaries_updated_at
  BEFORE UPDATE ON public.work_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for work_summaries
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_summaries;
