-- Privacy hardening: explicit roles, purpose-limited profiles, sanitized
-- matching, and anonymized manager data.

CREATE OR REPLACE FUNCTION public.is_venue_manager(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.venue_managers WHERE user_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_venue_manager(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_venue_manager(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_current_user_venue_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_venue_manager(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_current_user_venue_manager() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_venue_manager() TO authenticated;

-- A profile is readable only for a concrete product purpose: the user's own
-- account, a match participant, a visible note author, or a block relationship.
-- Candidate cards are returned separately by the sanitized matching RPC.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated students can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Purpose-limited profile visibility" ON public.profiles;
CREATE POLICY "Purpose-limited profile visibility" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR (
    NOT public.is_current_user_venue_manager()
    AND NOT public.is_venue_manager(id)
    AND (
      EXISTS (
        SELECT 1 FROM public.matches m
        WHERE (m.user_a = auth.uid() OR m.user_b = auth.uid())
          AND (m.user_a = profiles.id OR m.user_b = profiles.id)
      )
      OR EXISTS (
        SELECT 1 FROM public.notes n
        WHERE n.author_id = profiles.id AND n.moderation_status = 'visible'
      )
      OR EXISTS (
        SELECT 1 FROM public.user_blocks b
        WHERE (b.blocker_id = auth.uid() AND b.blocked_id = profiles.id)
           OR (b.blocked_id = auth.uid() AND b.blocker_id = profiles.id)
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
FOR DELETE TO authenticated USING (id = auth.uid());

-- Search sessions are private at table level. Candidate discovery is exposed
-- only through the sanitized function below.
DROP POLICY IF EXISTS "Sessions are viewable by everyone for matching" ON public.sessions;
DROP POLICY IF EXISTS "Users can view own search sessions" ON public.sessions;
CREATE POLICY "Users can view own search sessions" ON public.sessions
FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Students can insert own search sessions" ON public.sessions;
CREATE POLICY "Students can insert own search sessions" ON public.sessions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND NOT public.is_current_user_venue_manager());

DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Students can update own search sessions" ON public.sessions;
CREATE POLICY "Students can update own search sessions" ON public.sessions
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND NOT public.is_current_user_venue_manager())
WITH CHECK (user_id = auth.uid() AND NOT public.is_current_user_venue_manager());

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Students can delete own search sessions" ON public.sessions;
CREATE POLICY "Students can delete own search sessions" ON public.sessions
FOR DELETE TO authenticated
USING (user_id = auth.uid() AND NOT public.is_current_user_venue_manager());

-- Notes are community content for authenticated students, never anonymous
-- visitors or venue-manager accounts.
DROP POLICY IF EXISTS "Notes are viewable by everyone" ON public.notes;
DROP POLICY IF EXISTS "Visible notes are viewable" ON public.notes;
DROP POLICY IF EXISTS "Authenticated students can view visible notes" ON public.notes;
CREATE POLICY "Authenticated students can view visible notes" ON public.notes
FOR SELECT TO authenticated
USING (
  author_id = auth.uid()
  OR (moderation_status = 'visible' AND NOT public.is_current_user_venue_manager())
);

DROP POLICY IF EXISTS "Users can insert own notes" ON public.notes;
DROP POLICY IF EXISTS "Students can insert own notes" ON public.notes;
CREATE POLICY "Students can insert own notes" ON public.notes
FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND NOT public.is_current_user_venue_manager());

DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
DROP POLICY IF EXISTS "Students can update own notes" ON public.notes;
CREATE POLICY "Students can update own notes" ON public.notes
FOR UPDATE TO authenticated
USING (author_id = auth.uid() AND NOT public.is_current_user_venue_manager())
WITH CHECK (author_id = auth.uid() AND NOT public.is_current_user_venue_manager());

DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;
DROP POLICY IF EXISTS "Students can delete own notes" ON public.notes;
CREATE POLICY "Students can delete own notes" ON public.notes
FOR DELETE TO authenticated
USING (author_id = auth.uid() AND NOT public.is_current_user_venue_manager());

DROP POLICY IF EXISTS "Note likes are viewable by everyone" ON public.note_likes;
DROP POLICY IF EXISTS "Students can view note likes" ON public.note_likes;
CREATE POLICY "Students can view note likes" ON public.note_likes
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR NOT public.is_current_user_venue_manager());

DROP POLICY IF EXISTS "Users can like notes" ON public.note_likes;
DROP POLICY IF EXISTS "Students can like notes" ON public.note_likes;
CREATE POLICY "Students can like notes" ON public.note_likes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND NOT public.is_current_user_venue_manager());

DROP POLICY IF EXISTS "Users can unlike notes" ON public.note_likes;
DROP POLICY IF EXISTS "Students can unlike notes" ON public.note_likes;
CREATE POLICY "Students can unlike notes" ON public.note_likes
FOR DELETE TO authenticated
USING (user_id = auth.uid() AND NOT public.is_current_user_venue_manager());

-- Occupancy reports contain user identifiers. Direct reads are owner-only;
-- venue-wide history is returned anonymously by the manager RPC.
DROP POLICY IF EXISTS "Occupancy reports are viewable by everyone" ON public.occupancy_reports;
DROP POLICY IF EXISTS "Venue managers can view assigned occupancy" ON public.occupancy_reports;
DROP POLICY IF EXISTS "Users can view own occupancy reports" ON public.occupancy_reports;
CREATE POLICY "Users can view own occupancy reports" ON public.occupancy_reports
FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can report" ON public.occupancy_reports;
DROP POLICY IF EXISTS "Students can create own occupancy reports" ON public.occupancy_reports;
CREATE POLICY "Students can create own occupancy reports" ON public.occupancy_reports
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND NOT public.is_current_user_venue_manager());

-- Remove manager access to raw participant rows. The dashboard RPC below
-- returns only the operational fields shown in the interface.
DROP POLICY IF EXISTS "Venue managers can view assigned schedules" ON public.study_sessions;
DROP POLICY IF EXISTS "Venue managers can view assigned checkins" ON public.venue_checkins;

-- Schedule writes go through the participant-validating functions in migration
-- 009. Direct UPDATE would allow a participant to rewrite protected columns.
DROP POLICY IF EXISTS "Match participants can update schedules" ON public.study_sessions;

DROP POLICY IF EXISTS "Users can view own sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can view own study sessions" ON public.study_sessions;
CREATE POLICY "Users can view own study sessions" ON public.study_sessions
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = partner_id);

DROP POLICY IF EXISTS "Users can view matches they are part of" ON public.matches;
CREATE POLICY "Users can view matches they are part of" ON public.matches
FOR SELECT TO authenticated USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "Users can view own coupons" ON public.coupons;
CREATE POLICY "Users can view own coupons" ON public.coupons
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own coupons" ON public.coupons;
CREATE POLICY "Users can update own coupons" ON public.coupons
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Private note files follow the same student-only rule as note rows.
DROP POLICY IF EXISTS "Authenticated users can read note files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated students can read note files" ON storage.objects;
CREATE POLICY "Authenticated students can read note files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'notes' AND NOT public.is_current_user_venue_manager());

DROP POLICY IF EXISTS "Users can upload their own note files" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload their own note files" ON storage.objects;
CREATE POLICY "Students can upload their own note files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'notes'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND NOT public.is_current_user_venue_manager()
);

-- Return only candidates who satisfy the current user's active search. Raw
-- schedules of other students are no longer directly readable.
CREATE OR REPLACE FUNCTION public.find_match_candidates_private(p_session_id uuid)
RETURNS TABLE (
  candidate_user_id uuid,
  candidate_session_id uuid,
  display_name text,
  degree text,
  semester integer,
  subjects text[],
  avatar_color text,
  distance double precision,
  planned_start timestamptz,
  planned_end timestamptz,
  study_style text,
  language text,
  venue_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_session public.sessions%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF public.is_current_user_venue_manager() THEN RAISE EXCEPTION 'Student account required'; END IF;

  SELECT * INTO v_session
  FROM public.sessions
  WHERE id = p_session_id AND user_id = v_user
    AND status = 'active' AND expires_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Search session not found'; END IF;

  RETURN QUERY
  SELECT
    p.id,
    s.id,
    p.display_name,
    p.degree,
    p.semester,
    p.subjects,
    p.avatar_color,
    COALESCE(v.distance, 0)::double precision,
    s.planned_start,
    s.planned_end,
    s.study_style,
    s.language,
    s.venue_id
  FROM public.sessions s
  JOIN public.profiles p ON p.id = s.user_id
  LEFT JOIN public.venues v ON v.id = s.venue_id
  WHERE s.user_id <> v_user
    AND s.subject_id = v_session.subject_id
    AND s.planned_date = v_session.planned_date
    AND s.status = 'active'
    AND s.expires_at > now()
    AND s.planned_start < v_session.planned_end
    AND s.planned_end > v_session.planned_start
    AND COALESCE(v.distance, 0) <= COALESCE(v_session.max_distance_km, 5)
    AND NOT EXISTS (SELECT 1 FROM public.venue_managers vm WHERE vm.user_id = s.user_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks b
      WHERE (b.blocker_id = v_user AND b.blocked_id = s.user_id)
         OR (b.blocker_id = s.user_id AND b.blocked_id = v_user)
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.matches m
      WHERE ((m.user_a = v_user AND m.user_b = s.user_id) OR (m.user_a = s.user_id AND m.user_b = v_user))
        AND (
          m.status = 'accepted'
          OR (m.status = 'pending' AND m.user_a = v_user)
          OR (m.status = 'ended' AND m.ended_at > now() - interval '5 minutes')
        )
    )
  ORDER BY s.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.find_match_candidates_private(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_match_candidates_private(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_managed_venue_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_assignment public.venue_managers%ROWTYPE;
  v_venue public.venues%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_assignment FROM public.venue_managers WHERE user_id = v_user;
  IF NOT FOUND THEN RAISE EXCEPTION 'Venue manager account not found'; END IF;
  SELECT * INTO v_venue FROM public.venues WHERE id = v_assignment.venue_id;

  RETURN jsonb_build_object(
    'assignmentId', v_assignment.id,
    'venue', to_jsonb(v_venue),
    'activeCheckins', (
      SELECT count(*) FROM public.venue_checkins
      WHERE venue_id = v_assignment.venue_id AND checked_out_at IS NULL
    ),
    'upcomingSessions', COALESCE((
      SELECT jsonb_agg(to_jsonb(safe_session) ORDER BY safe_session.starts_at)
      FROM (
        SELECT id, starts_at, ends_at, status, duration_hours
        FROM public.study_sessions
        WHERE venue_id = v_assignment.venue_id
          AND status IN ('proposed', 'confirmed') AND ends_at >= now()
        ORDER BY starts_at ASC LIMIT 12
      ) safe_session
    ), '[]'::jsonb),
    'recentCheckins', COALESCE((
      SELECT jsonb_agg(to_jsonb(safe_checkin) ORDER BY safe_checkin.checked_in_at DESC)
      FROM (
        SELECT id, checked_in_at, checked_out_at
        FROM public.venue_checkins
        WHERE venue_id = v_assignment.venue_id
        ORDER BY checked_in_at DESC LIMIT 8
      ) safe_checkin
    ), '[]'::jsonb),
    'occupancyHistory', COALESCE((
      SELECT jsonb_agg(to_jsonb(safe_report) ORDER BY safe_report.reported_at DESC)
      FROM (
        SELECT id, occupancy_pct, reported_at
        FROM public.occupancy_reports
        WHERE venue_id = v_assignment.venue_id
        ORDER BY reported_at DESC LIMIT 12
      ) safe_report
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_managed_venue_dashboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_managed_venue_dashboard() TO authenticated;
