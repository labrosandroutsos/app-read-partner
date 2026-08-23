-- Note moderation and user safety. Run once in the Supabase SQL editor.
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'visible'
  CHECK (moderation_status IN ('visible', 'hidden'));

CREATE TABLE IF NOT EXISTS public.note_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'unsafe', 'impersonation', 'copyright', 'other')),
  details text CHECK (char_length(details) <= 500),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, note_id)
);

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'unsafe', 'impersonation', 'copyright', 'other')),
  details text CHECK (char_length(details) <= 500),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, reported_id),
  CHECK (reporter_id <> reported_id)
);

ALTER TABLE public.note_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notes are viewable by everyone" ON public.notes;
CREATE POLICY "Visible notes are viewable" ON public.notes
FOR SELECT USING (moderation_status = 'visible' OR author_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their note reports" ON public.note_reports;
CREATE POLICY "Users can view their note reports" ON public.note_reports
FOR SELECT TO authenticated USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their blocks" ON public.user_blocks;
CREATE POLICY "Users can view their blocks" ON public.user_blocks
FOR SELECT TO authenticated USING (blocker_id = auth.uid() OR blocked_id = auth.uid());
DROP POLICY IF EXISTS "Users can create their blocks" ON public.user_blocks;
CREATE POLICY "Users can create their blocks" ON public.user_blocks
FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());
DROP POLICY IF EXISTS "Users can remove their blocks" ON public.user_blocks;
CREATE POLICY "Users can remove their blocks" ON public.user_blocks
FOR DELETE TO authenticated USING (blocker_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their user reports" ON public.user_reports;
CREATE POLICY "Users can view their user reports" ON public.user_reports
FOR SELECT TO authenticated USING (reporter_id = auth.uid());
DROP POLICY IF EXISTS "Users can create user reports" ON public.user_reports;
CREATE POLICY "Users can create user reports" ON public.user_reports
FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
DROP POLICY IF EXISTS "Users can update their user reports" ON public.user_reports;
CREATE POLICY "Users can update their user reports" ON public.user_reports
FOR UPDATE TO authenticated USING (reporter_id = auth.uid()) WITH CHECK (reporter_id = auth.uid());

CREATE OR REPLACE FUNCTION public.report_note(
  p_note_id uuid,
  p_reason text,
  p_details text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_count integer;
  note_author uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_reason NOT IN ('spam', 'harassment', 'unsafe', 'impersonation', 'copyright', 'other') THEN
    RAISE EXCEPTION 'Invalid report reason';
  END IF;
  IF char_length(coalesce(p_details, '')) > 500 THEN RAISE EXCEPTION 'Report details are too long'; END IF;

  SELECT author_id INTO note_author FROM public.notes WHERE id = p_note_id;
  IF note_author IS NULL THEN RAISE EXCEPTION 'Note not found'; END IF;
  IF note_author = auth.uid() THEN RAISE EXCEPTION 'You cannot report your own note'; END IF;

  INSERT INTO public.note_reports (reporter_id, note_id, reason, details)
  VALUES (auth.uid(), p_note_id, p_reason, nullif(trim(p_details), ''))
  ON CONFLICT (reporter_id, note_id)
  DO UPDATE SET reason = EXCLUDED.reason, details = EXCLUDED.details, status = 'open', created_at = now();

  SELECT count(*) INTO report_count FROM public.note_reports WHERE note_id = p_note_id AND status = 'open';
  IF report_count >= 3 THEN
    UPDATE public.notes SET moderation_status = 'hidden' WHERE id = p_note_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.report_note(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.report_note(uuid, text, text) TO authenticated;

-- A block immediately prevents messages in either direction.
DROP POLICY IF EXISTS "Users can send messages as themselves" ON public.messages;
CREATE POLICY "Users can send messages as themselves" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND NOT EXISTS (
    SELECT 1
    FROM public.matches m
    JOIN public.user_blocks b
      ON (b.blocker_id = m.user_a AND b.blocked_id = m.user_b)
      OR (b.blocker_id = m.user_b AND b.blocked_id = m.user_a)
    WHERE m.id = messages.match_id
  )
);

DROP POLICY IF EXISTS "Users can view messages for their matches" ON public.messages;
CREATE POLICY "Users can view messages for their unblocked matches" ON public.messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.id = messages.match_id
      AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
      AND NOT EXISTS (
        SELECT 1 FROM public.user_blocks b
        WHERE (b.blocker_id = m.user_a AND b.blocked_id = m.user_b)
           OR (b.blocker_id = m.user_b AND b.blocked_id = m.user_a)
      )
  )
);

CREATE INDEX IF NOT EXISTS note_reports_note_id_idx ON public.note_reports(note_id);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_id_idx ON public.user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS user_reports_reported_id_idx ON public.user_reports(reported_id);
