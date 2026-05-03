
ALTER TABLE public.goal_milestones
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS attachment_url text;

CREATE TABLE IF NOT EXISTS public.goal_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_id uuid NOT NULL,
  milestone_id uuid,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goal_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attachments" ON public.goal_attachments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own attachments" ON public.goal_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own attachments" ON public.goal_attachments
  FOR DELETE USING (auth.uid() = user_id);

-- Storage policies for the existing checkin-pdfs bucket (used for PDFs + images)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users manage own checkin attachments select') THEN
    CREATE POLICY "Users manage own checkin attachments select" ON storage.objects
      FOR SELECT USING (bucket_id = 'checkin-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users manage own checkin attachments insert') THEN
    CREATE POLICY "Users manage own checkin attachments insert" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'checkin-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users manage own checkin attachments delete') THEN
    CREATE POLICY "Users manage own checkin attachments delete" ON storage.objects
      FOR DELETE USING (bucket_id = 'checkin-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END$$;
