CREATE TABLE public.daily_mood_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, check_in_date)
);

ALTER TABLE public.daily_mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily mood logs"
  ON public.daily_mood_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily mood logs"
  ON public.daily_mood_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily mood logs"
  ON public.daily_mood_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily mood logs"
  ON public.daily_mood_logs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_daily_mood_logs_user_date
  ON public.daily_mood_logs(user_id, check_in_date DESC);

CREATE TRIGGER update_daily_mood_logs_updated_at
  BEFORE UPDATE ON public.daily_mood_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
