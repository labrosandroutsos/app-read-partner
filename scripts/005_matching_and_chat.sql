-- 005_matching_and_chat.sql
-- Atomic mutual matching and per-user conversation read state.

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS user_a_last_read_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS user_b_last_read_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS messages_match_created_at_idx
  ON messages (match_id, created_at);

-- Matches may only be created or changed through the validated functions below.
DROP POLICY IF EXISTS "Users can create matches they are part of" ON matches;
DROP POLICY IF EXISTS "Users can update matches they are part of" ON matches;

-- A sender must belong to an accepted match. System messages are function-owned.
DROP POLICY IF EXISTS "Users can send messages as themselves" ON messages;
CREATE POLICY "Match participants can send messages" ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND is_system = false
    AND EXISTS (
      SELECT 1
      FROM matches
      WHERE matches.id = messages.match_id
        AND matches.status = 'accepted'
        AND (matches.user_a = auth.uid() OR matches.user_b = auth.uid())
    )
  );

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
  v_session sessions%ROWTYPE;
  v_candidate sessions%ROWTYPE;
  v_match matches%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_session
  FROM sessions
  WHERE id = p_session_id
    AND user_id = v_user_id
    AND planned_date = CURRENT_DATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Search session not found';
  END IF;

  SELECT * INTO v_candidate
  FROM sessions
  WHERE id = p_candidate_session_id
    AND user_id <> v_user_id
    AND planned_date = v_session.planned_date;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidate session not found';
  END IF;

  IF v_session.subject_id IS DISTINCT FROM v_candidate.subject_id THEN
    RAISE EXCEPTION 'Candidate subject is incompatible';
  END IF;

  IF v_session.venue_id IS NOT NULL
    AND v_candidate.venue_id IS NOT NULL
    AND v_session.venue_id <> v_candidate.venue_id THEN
    RAISE EXCEPTION 'Candidate venue is incompatible';
  END IF;

  -- Serialize both A->B and B->A swipes for this user pair.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      LEAST(v_user_id::text, v_candidate.user_id::text)
      || ':' ||
      GREATEST(v_user_id::text, v_candidate.user_id::text),
      0
    )
  );

  SELECT * INTO v_match
  FROM matches
  WHERE status = 'accepted'
    AND (
      (user_a = v_user_id AND user_b = v_candidate.user_id)
      OR (user_a = v_candidate.user_id AND user_b = v_user_id)
    )
  ORDER BY matched_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT v_match.id, true;
    RETURN;
  END IF;

  SELECT * INTO v_match
  FROM matches
  WHERE user_a = v_candidate.user_id
    AND user_b = v_user_id
    AND status = 'pending'
  ORDER BY matched_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    UPDATE matches
    SET status = 'accepted',
        session_b = v_session.id,
        subject_id = v_session.subject_id,
        venue_id = COALESCE(v_session.venue_id, v_candidate.venue_id),
        matched_at = now(),
        user_a_last_read_at = now(),
        user_b_last_read_at = now()
    WHERE id = v_match.id;

    INSERT INTO messages (match_id, sender_id, text, is_system)
    VALUES (v_match.id, NULL, 'chat.match.confirmed', true);

    RETURN QUERY SELECT v_match.id, true;
    RETURN;
  END IF;

  SELECT * INTO v_match
  FROM matches
  WHERE user_a = v_user_id
    AND user_b = v_candidate.user_id
    AND status = 'pending'
  ORDER BY matched_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT v_match.id, false;
    RETURN;
  END IF;

  INSERT INTO matches (
    user_a,
    user_b,
    session_a,
    session_b,
    subject_id,
    venue_id,
    status
  )
  VALUES (
    v_user_id,
    v_candidate.user_id,
    v_session.id,
    v_candidate.id,
    v_session.subject_id,
    COALESCE(v_session.venue_id, v_candidate.venue_id),
    'pending'
  )
  RETURNING * INTO v_match;

  RETURN QUERY SELECT v_match.id, false;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_match_read(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE matches
  SET user_a_last_read_at = CASE
        WHEN user_a = v_user_id THEN now()
        ELSE user_a_last_read_at
      END,
      user_b_last_read_at = CASE
        WHEN user_b = v_user_id THEN now()
        ELSE user_b_last_read_at
      END
  WHERE id = p_match_id
    AND status = 'accepted'
    AND (user_a = v_user_id OR user_b = v_user_id);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.swipe_on_session(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_match_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.swipe_on_session(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_match_read(uuid) TO authenticated;
