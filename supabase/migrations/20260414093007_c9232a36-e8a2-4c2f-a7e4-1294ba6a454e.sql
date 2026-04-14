
CREATE TABLE public.commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  time_of_day TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily',
  custom_days TEXT[],
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own commitments" ON public.commitments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own commitments" ON public.commitments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own commitments" ON public.commitments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own commitments" ON public.commitments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_commitments_updated_at BEFORE UPDATE ON public.commitments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
