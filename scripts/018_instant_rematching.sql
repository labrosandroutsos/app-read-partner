-- Allow immediate rematching after either participant ends an accepted match.
-- This intentionally removes the development cooldown from both enforcement
-- points: match creation and candidate discovery.

DROP TRIGGER IF EXISTS enforce_match_cooldown_trigger ON public.matches;

CREATE OR REPLACE FUNCTION private.find_match_candidates_core(p_session_id uuid)
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
SET search_path = ''
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
        )
    )
  ORDER BY s.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION private.find_match_candidates_core(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.find_match_candidates_core(uuid) TO authenticated;
