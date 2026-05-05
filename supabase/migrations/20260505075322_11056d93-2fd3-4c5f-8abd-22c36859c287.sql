
CREATE TABLE public.sleep_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sleep_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_min INT NOT NULL,
  quality INT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sleep_logs_user_date ON public.sleep_logs(user_id, sleep_date);
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sleep logs" ON public.sleep_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sleep logs" ON public.sleep_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sleep logs" ON public.sleep_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sleep logs" ON public.sleep_logs FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_sleep_log()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'Sleep end_time must be after start_time';
  END IF;
  IF EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60 > 16 * 60 THEN
    RAISE EXCEPTION 'Sleep duration must be at most 16 hours';
  END IF;
  NEW.duration_min := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60))::INT;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_sleep_log
BEFORE INSERT OR UPDATE ON public.sleep_logs
FOR EACH ROW EXECUTE FUNCTION public.validate_sleep_log();

CREATE TABLE public.sleep_preferences (
  user_id UUID NOT NULL PRIMARY KEY,
  target_hours NUMERIC NOT NULL DEFAULT 7.5,
  typical_bedtime TEXT,
  typical_waketime TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sleep_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sleep preferences" ON public.sleep_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sleep preferences" ON public.sleep_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sleep preferences" ON public.sleep_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sleep preferences" ON public.sleep_preferences FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_sleep_preferences_updated_at
BEFORE UPDATE ON public.sleep_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
