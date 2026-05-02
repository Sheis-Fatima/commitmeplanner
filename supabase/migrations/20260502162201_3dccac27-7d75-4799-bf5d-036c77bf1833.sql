
-- Milestones table
CREATE TABLE public.goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL,
  user_id UUID NOT NULL,
  period_index INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  deliverable TEXT NOT NULL,
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own milestones"
  ON public.goal_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own milestones"
  ON public.goal_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own milestones"
  ON public.goal_milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own milestones"
  ON public.goal_milestones FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_goal_milestones_updated_at
BEFORE UPDATE ON public.goal_milestones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_goal_milestones_goal_id ON public.goal_milestones(goal_id);

-- Extend check_ins
ALTER TABLE public.check_ins
  ADD COLUMN milestone_id UUID,
  ADD COLUMN pdf_url TEXT,
  ADD COLUMN deliverable_score INTEGER,
  ADD COLUMN ai_feedback TEXT,
  ADD COLUMN user_override BOOLEAN NOT NULL DEFAULT false;

-- Storage bucket for check-in PDFs (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('checkin-pdfs', 'checkin-pdfs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can view their own check-in PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'checkin-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own check-in PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'checkin-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own check-in PDFs"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'checkin-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own check-in PDFs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'checkin-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
