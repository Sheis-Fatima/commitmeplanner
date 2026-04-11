
-- Create enum for check-in frequency
CREATE TYPE public.checkin_frequency AS ENUM ('weekly', 'monthly');

-- Create enum for goal status
CREATE TYPE public.goal_status AS ENUM ('active', 'paused', 'completed');

-- Goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status public.goal_status NOT NULL DEFAULT 'active',
  checkin_frequency public.checkin_frequency NOT NULL DEFAULT 'weekly',
  target_date DATE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Goal steps table
CREATE TABLE public.goal_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  step_order INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.goal_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own steps" ON public.goal_steps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own steps" ON public.goal_steps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own steps" ON public.goal_steps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own steps" ON public.goal_steps FOR DELETE USING (auth.uid() = user_id);

-- Check-ins table
CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT,
  progress_value INTEGER NOT NULL CHECK (progress_value >= 0 AND progress_value <= 100),
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own check-ins" ON public.check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own check-ins" ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own check-ins" ON public.check_ins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own check-ins" ON public.check_ins FOR DELETE USING (auth.uid() = user_id);

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_status ON public.goals(user_id, status);
CREATE INDEX idx_goal_steps_goal_id ON public.goal_steps(goal_id);
CREATE INDEX idx_check_ins_goal_id ON public.check_ins(goal_id);
CREATE INDEX idx_check_ins_created ON public.check_ins(user_id, created_at);
