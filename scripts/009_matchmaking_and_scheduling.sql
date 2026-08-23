-- Rich availability matching and real schedule proposals.
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS planned_start timestamptz,
  ADD COLUMN IF NOT EXISTS planned_end timestamptz,
  ADD COLUMN IF NOT EXISTS study_style text NOT NULL DEFAULT 'either'
    CHECK (study_style IN ('quiet', 'social', 'either')),
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'either'
    CHECK (language IN ('el', 'en', 'either')),
  ADD COLUMN IF NOT EXISTS max_distance_km numeric NOT NULL DEFAULT 5 CHECK (max_distance_km BETWEEN 0.5 AND 50),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'matched', 'cancelled')),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

UPDATE public.sessions
SET planned_start = COALESCE(planned_start, (planned_date::timestamp + time '12:00') AT TIME ZONE 'Europe/Athens'),
    planned_end = COALESCE(planned_end, (planned_date::timestamp + time '14:00') AT TIME ZONE 'Europe/Athens'),
    expires_at = COALESCE(expires_at, ((planned_date + 1)::timestamp) AT TIME ZONE 'Europe/Athens');

ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('proposed', 'confirmed', 'cancelled', 'completed')),
  ADD COLUMN IF NOT EXISTS proposed_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.study_sessions
SET starts_at = COALESCE(starts_at, (date::timestamp + time '12:00') AT TIME ZONE 'Europe/Athens'),
    ends_at = COALESCE(ends_at, ((date::timestamp + time '12:00') AT TIME ZONE 'Europe/Athens') + make_interval(hours => duration_hours::int));

CREATE INDEX IF NOT EXISTS sessions_matching_v2_idx
  ON public.sessions(subject_id, status, planned_start, planned_end);
CREATE INDEX IF NOT EXISTS study_sessions_participants_idx
  ON public.study_sessions(user_id, partner_id, starts_at);
CREATE UNIQUE INDEX IF NOT EXISTS study_sessions_one_active_match_idx
  ON public.study_sessions(match_id) WHERE match_id IS NOT NULL AND status IN ('proposed', 'confirmed');

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Match participants can update schedules" ON public.study_sessions;
CREATE POLICY "Match participants can update schedules" ON public.study_sessions
FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR auth.uid() = partner_id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE OR REPLACE FUNCTION public.propose_study_session(
  p_match_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_venue_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_match public.matches%ROWTYPE;
  v_schedule public.study_sessions%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_starts_at <= now() THEN RAISE EXCEPTION 'Schedule must be in the future'; END IF;
  IF p_ends_at <= p_starts_at OR p_ends_at > p_starts_at + interval '8 hours' THEN
    RAISE EXCEPTION 'Invalid schedule duration';
  END IF;

  SELECT * INTO v_match FROM public.matches
  WHERE id = p_match_id AND status = 'accepted' AND (user_a = v_user OR user_b = v_user);
  IF NOT FOUND THEN RAISE EXCEPTION 'Match not found'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = v_match.user_a AND blocked_id = v_match.user_b)
       OR (blocker_id = v_match.user_b AND blocked_id = v_match.user_a)
  ) THEN RAISE EXCEPTION 'Scheduling is unavailable'; END IF;

  SELECT * INTO v_schedule FROM public.study_sessions
  WHERE match_id = p_match_id AND status IN ('proposed', 'confirmed')
  ORDER BY updated_at DESC LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    UPDATE public.study_sessions SET
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      date = (p_starts_at AT TIME ZONE 'Europe/Athens')::date,
      duration_hours = extract(epoch FROM (p_ends_at - p_starts_at)) / 3600,
      venue_id = p_venue_id,
      status = 'proposed',
      proposed_by = v_user,
      accepted_at = NULL,
      updated_at = now()
    WHERE id = v_schedule.id
    RETURNING * INTO v_schedule;
  ELSE
    INSERT INTO public.study_sessions (
      match_id, user_id, partner_id, subject_id, venue_id, date, duration_hours,
      starts_at, ends_at, status, proposed_by, updated_at
    ) VALUES (
      p_match_id, v_match.user_a, v_match.user_b, v_match.subject_id, p_venue_id,
      (p_starts_at AT TIME ZONE 'Europe/Athens')::date,
      extract(epoch FROM (p_ends_at - p_starts_at)) / 3600,
      p_starts_at, p_ends_at, 'proposed', v_user, now()
    ) RETURNING * INTO v_schedule;
  END IF;

  INSERT INTO public.messages(match_id, sender_id, text, is_system)
  VALUES (p_match_id, NULL, 'chat.schedule.proposed', true);
  RETURN v_schedule.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_study_session(p_session_id uuid, p_accept boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_schedule public.study_sessions%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_schedule FROM public.study_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND OR v_schedule.status <> 'proposed' OR (v_schedule.user_id <> v_user AND v_schedule.partner_id <> v_user) THEN
    RAISE EXCEPTION 'Schedule proposal not found';
  END IF;
  IF v_schedule.proposed_by = v_user THEN RAISE EXCEPTION 'The other participant must respond'; END IF;

  UPDATE public.study_sessions
  SET status = CASE WHEN p_accept THEN 'confirmed' ELSE 'cancelled' END,
      accepted_at = CASE WHEN p_accept THEN now() ELSE NULL END,
      updated_at = now()
  WHERE id = p_session_id;

  INSERT INTO public.messages(match_id, sender_id, text, is_system)
  VALUES (v_schedule.match_id, NULL, CASE WHEN p_accept THEN 'chat.schedule.confirmed' ELSE 'chat.schedule.declined' END, true);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_study_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_schedule public.study_sessions%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_schedule FROM public.study_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND OR v_schedule.status NOT IN ('proposed', 'confirmed')
     OR (v_schedule.user_id <> v_user AND v_schedule.partner_id <> v_user) THEN
    RAISE EXCEPTION 'Schedule not found';
  END IF;
  UPDATE public.study_sessions SET status = 'cancelled', updated_at = now() WHERE id = p_session_id;
  INSERT INTO public.messages(match_id, sender_id, text, is_system)
  VALUES (v_schedule.match_id, NULL, 'chat.schedule.cancelled', true);
END;
$$;

REVOKE ALL ON FUNCTION public.propose_study_session(uuid, timestamptz, timestamptz, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.respond_study_session(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_study_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.propose_study_session(uuid, timestamptz, timestamptz, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_study_session(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_study_session(uuid) TO authenticated;

-- Preserve both accepted-match validation and block enforcement for messages.
DROP POLICY IF EXISTS "Users can send messages as themselves" ON public.messages;
DROP POLICY IF EXISTS "Match participants can send messages" ON public.messages;
CREATE POLICY "Unblocked match participants can send messages" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND is_system = false
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id AND m.status = 'accepted'
      AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
      AND NOT EXISTS (
        SELECT 1 FROM public.user_blocks b
        WHERE (b.blocker_id = m.user_a AND b.blocked_id = m.user_b)
           OR (b.blocker_id = m.user_b AND b.blocked_id = m.user_a)
      )
  )
);

-- Replace the original today-only swipe validation with availability-aware validation.
CREATE OR REPLACE FUNCTION public.swipe_on_session(
  p_session_id uuid,
  p_candidate_session_id uuid
)
RETURNS TABLE (match_id uuid, matched boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_session public.sessions%ROWTYPE;
  v_candidate public.sessions%ROWTYPE;
  v_match public.matches%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_session FROM public.sessions
  WHERE id = p_session_id AND user_id = v_user_id
    AND status = 'active' AND expires_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Search session not found'; END IF;

  SELECT * INTO v_candidate FROM public.sessions
  WHERE id = p_candidate_session_id AND user_id <> v_user_id
    AND status = 'active' AND expires_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Candidate session not found'; END IF;
  IF v_session.subject_id IS DISTINCT FROM v_candidate.subject_id THEN RAISE EXCEPTION 'Candidate subject is incompatible'; END IF;
  IF v_session.planned_start >= v_candidate.planned_end OR v_candidate.planned_start >= v_session.planned_end THEN
    RAISE EXCEPTION 'Candidate availability does not overlap';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = v_user_id AND blocked_id = v_candidate.user_id)
       OR (blocker_id = v_candidate.user_id AND blocked_id = v_user_id)
  ) THEN RAISE EXCEPTION 'Candidate unavailable'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    LEAST(v_user_id::text, v_candidate.user_id::text) || ':' || GREATEST(v_user_id::text, v_candidate.user_id::text), 0
  ));

  SELECT * INTO v_match FROM public.matches
  WHERE status = 'accepted' AND ((user_a = v_user_id AND user_b = v_candidate.user_id) OR (user_a = v_candidate.user_id AND user_b = v_user_id))
  ORDER BY matched_at DESC LIMIT 1;
  IF FOUND THEN RETURN QUERY SELECT v_match.id, true; RETURN; END IF;

  SELECT * INTO v_match FROM public.matches
  WHERE user_a = v_candidate.user_id AND user_b = v_user_id AND status = 'pending'
  ORDER BY matched_at DESC LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    UPDATE public.matches SET
      status = 'accepted', session_b = v_session.id, subject_id = v_session.subject_id,
      venue_id = CASE WHEN v_session.venue_id = v_candidate.venue_id THEN v_session.venue_id ELSE COALESCE(v_session.venue_id, v_candidate.venue_id) END,
      matched_at = now(), user_a_last_read_at = now(), user_b_last_read_at = now()
    WHERE id = v_match.id;
    UPDATE public.sessions SET status = 'matched' WHERE id IN (v_session.id, v_candidate.id);
    INSERT INTO public.messages(match_id, sender_id, text, is_system) VALUES (v_match.id, NULL, 'chat.match.confirmed', true);
    RETURN QUERY SELECT v_match.id, true; RETURN;
  END IF;

  SELECT * INTO v_match FROM public.matches
  WHERE user_a = v_user_id AND user_b = v_candidate.user_id AND status = 'pending'
  ORDER BY matched_at DESC LIMIT 1;
  IF FOUND THEN RETURN QUERY SELECT v_match.id, false; RETURN; END IF;

  INSERT INTO public.matches(user_a, user_b, session_a, session_b, subject_id, venue_id, status)
  VALUES (
    v_user_id, v_candidate.user_id, v_session.id, v_candidate.id, v_session.subject_id,
    CASE WHEN v_session.venue_id = v_candidate.venue_id THEN v_session.venue_id ELSE COALESCE(v_session.venue_id, v_candidate.venue_id) END,
    'pending'
  ) RETURNING * INTO v_match;
  RETURN QUERY SELECT v_match.id, false;
END;
$$;

REVOKE ALL ON FUNCTION public.swipe_on_session(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.swipe_on_session(uuid, uuid) TO authenticated;
