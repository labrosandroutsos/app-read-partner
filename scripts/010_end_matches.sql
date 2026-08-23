-- End accepted matches safely and allow rematching after a short cooldown.
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS ended_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE public.matches
  ADD CONSTRAINT matches_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'ended'));

CREATE INDEX IF NOT EXISTS matches_recently_ended_idx
  ON public.matches (ended_at)
  WHERE status = 'ended';

-- Enforce the five-minute cooldown even if matching is called outside the UI.
CREATE OR REPLACE FUNCTION public.enforce_match_cooldown()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('pending', 'accepted') AND EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.status = 'ended'
      AND m.ended_at > now() - interval '5 minutes'
      AND (
        (m.user_a = NEW.user_a AND m.user_b = NEW.user_b)
        OR (m.user_a = NEW.user_b AND m.user_b = NEW.user_a)
      )
  ) THEN
    RAISE EXCEPTION 'Please wait a few minutes before matching with this person again';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_match_cooldown_trigger ON public.matches;
CREATE TRIGGER enforce_match_cooldown_trigger
BEFORE INSERT OR UPDATE OF status ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.enforce_match_cooldown();

CREATE OR REPLACE FUNCTION public.end_match(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_match public.matches%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_match
  FROM public.matches
  WHERE id = p_match_id AND (user_a = v_user OR user_b = v_user);

  IF NOT FOUND THEN RAISE EXCEPTION 'Match not found'; END IF;

  -- Serialize end/rematch operations for the same pair.
  PERFORM pg_advisory_xact_lock(hashtextextended(
    LEAST(v_match.user_a::text, v_match.user_b::text) || ':' ||
    GREATEST(v_match.user_a::text, v_match.user_b::text), 0
  ));

  SELECT * INTO v_match
  FROM public.matches
  WHERE id = p_match_id AND (user_a = v_user OR user_b = v_user)
  FOR UPDATE;

  IF v_match.status <> 'accepted' THEN RAISE EXCEPTION 'Only an accepted match can be ended'; END IF;

  INSERT INTO public.messages(match_id, sender_id, text, is_system)
  VALUES (p_match_id, NULL, 'chat.match.ended', true);

  UPDATE public.study_sessions
  SET status = 'cancelled', updated_at = now()
  WHERE match_id = p_match_id AND status IN ('proposed', 'confirmed');

  UPDATE public.matches
  SET status = 'ended', ended_at = now(), ended_by = v_user
  WHERE id = p_match_id;
END;
$$;

REVOKE ALL ON FUNCTION public.end_match(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.end_match(uuid) TO authenticated;

-- Participants can chat only while the match is active. Messages remain stored
-- for safety and future moderator review.
DROP POLICY IF EXISTS "Users can view messages for their unblocked matches" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages for their active unblocked matches" ON public.messages;
CREATE POLICY "Users can view messages for their active unblocked matches" ON public.messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.id = messages.match_id
      AND m.status = 'accepted'
      AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
      AND NOT EXISTS (
        SELECT 1 FROM public.user_blocks b
        WHERE (b.blocker_id = m.user_a AND b.blocked_id = m.user_b)
           OR (b.blocker_id = m.user_b AND b.blocked_id = m.user_a)
      )
  )
);
