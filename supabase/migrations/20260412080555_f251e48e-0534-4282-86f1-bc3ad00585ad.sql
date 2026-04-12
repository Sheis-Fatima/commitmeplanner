
-- Create emergency_commitments table
CREATE TABLE public.emergency_commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'high' CHECK (priority IN ('high', 'critical')),
  duration_days INTEGER NOT NULL DEFAULT 7,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emergency_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own emergency commitments"
ON public.emergency_commitments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own emergency commitments"
ON public.emergency_commitments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emergency commitments"
ON public.emergency_commitments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emergency commitments"
ON public.emergency_commitments FOR DELETE
USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_emergency_commitments_updated_at
BEFORE UPDATE ON public.emergency_commitments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
