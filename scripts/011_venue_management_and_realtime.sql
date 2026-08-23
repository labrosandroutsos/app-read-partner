-- Venue manager portal, real check-ins, and Realtime delivery.

-- Each manager owns exactly one venue account, and each venue has at most one manager.
CREATE TABLE IF NOT EXISTS public.venue_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL UNIQUE REFERENCES public.venues(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.venue_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  checked_out_at timestamptz,
  CHECK (checked_out_at IS NULL OR checked_out_at >= checked_in_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS venue_checkins_one_active_user_idx
  ON public.venue_checkins (user_id)
  WHERE checked_out_at IS NULL;
CREATE INDEX IF NOT EXISTS venue_checkins_active_venue_idx
  ON public.venue_checkins (venue_id, checked_in_at DESC)
  WHERE checked_out_at IS NULL;

ALTER TABLE public.venue_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can view their venue assignment" ON public.venue_managers;
CREATE POLICY "Managers can view their venue assignment" ON public.venue_managers
FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their checkins" ON public.venue_checkins;
CREATE POLICY "Users can view their checkins" ON public.venue_checkins
FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Venue managers can view assigned checkins" ON public.venue_checkins;
CREATE POLICY "Venue managers can view assigned checkins" ON public.venue_checkins
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.venue_managers vm
    WHERE vm.user_id = auth.uid() AND vm.venue_id = venue_checkins.venue_id
  )
);

DROP POLICY IF EXISTS "Venue managers can view assigned schedules" ON public.study_sessions;
CREATE POLICY "Venue managers can view assigned schedules" ON public.study_sessions
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.venue_managers vm
    WHERE vm.user_id = auth.uid() AND vm.venue_id = study_sessions.venue_id
  )
);

DROP POLICY IF EXISTS "Venue managers can view assigned occupancy" ON public.occupancy_reports;
CREATE POLICY "Venue managers can view assigned occupancy" ON public.occupancy_reports
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.venue_managers vm
    WHERE vm.user_id = auth.uid() AND vm.venue_id = occupancy_reports.venue_id
  )
);

CREATE OR REPLACE FUNCTION public.toggle_venue_checkin(p_venue_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_active public.venue_checkins%ROWTYPE;
  v_open boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  SELECT * INTO v_active
  FROM public.venue_checkins
  WHERE user_id = v_user AND checked_out_at IS NULL
  FOR UPDATE;

  IF FOUND AND v_active.venue_id = p_venue_id THEN
    UPDATE public.venue_checkins SET checked_out_at = now() WHERE id = v_active.id;
    RETURN false;
  END IF;

  SELECT is_open INTO v_open FROM public.venues WHERE id = p_venue_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Venue not found'; END IF;
  IF v_open IS NOT TRUE THEN RAISE EXCEPTION 'Venue is closed'; END IF;

  IF v_active.id IS NOT NULL THEN
    UPDATE public.venue_checkins SET checked_out_at = now() WHERE id = v_active.id;
  END IF;

  INSERT INTO public.venue_checkins(venue_id, user_id) VALUES (p_venue_id, v_user);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_managed_venue(
  p_is_open boolean,
  p_occupancy integer,
  p_discount integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_venue uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_is_open IS NULL THEN RAISE EXCEPTION 'Venue status is required'; END IF;
  IF p_occupancy IS NULL OR p_occupancy < 0 OR p_occupancy > 100 THEN RAISE EXCEPTION 'Occupancy must be between 0 and 100'; END IF;
  IF p_discount IS NOT NULL AND (p_discount < 0 OR p_discount > 100) THEN RAISE EXCEPTION 'Discount must be between 0 and 100'; END IF;

  SELECT venue_id INTO v_venue FROM public.venue_managers WHERE user_id = v_user;
  IF v_venue IS NULL THEN RAISE EXCEPTION 'Venue manager account not found'; END IF;

  UPDATE public.venues
  SET is_open = p_is_open, occupancy = p_occupancy, discount = NULLIF(p_discount, 0)
  WHERE id = v_venue;

  INSERT INTO public.occupancy_reports(venue_id, user_id, occupancy_pct)
  VALUES (v_venue, v_user, p_occupancy);
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_venue_checkin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_managed_venue(boolean, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_venue_checkin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_managed_venue(boolean, integer, integer) TO authenticated;

-- Realtime is required for instant messages, schedule cards, check-ins, and occupancy.
ALTER TABLE public.study_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.venue_checkins REPLICA IDENTITY FULL;
ALTER TABLE public.venues REPLICA IDENTITY FULL;

DO $$
DECLARE
  v_table text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH v_table IN ARRAY ARRAY['messages', 'study_sessions', 'occupancy_reports', 'venue_checkins', 'venues']
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = v_table
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_table);
      END IF;
    END LOOP;
  END IF;
END;
$$;

-- After the manager signs up normally, an administrator assigns the account once:
-- INSERT INTO public.venue_managers(user_id, venue_id)
-- VALUES ('MANAGER_PROFILE_UUID', 'VENUE_UUID');
