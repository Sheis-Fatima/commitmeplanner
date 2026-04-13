
ALTER TABLE public.emergency_commitments 
ADD COLUMN time_of_day TEXT,
ADD COLUMN frequency TEXT NOT NULL DEFAULT 'daily',
ADD COLUMN custom_days TEXT[];
