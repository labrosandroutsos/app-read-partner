-- Role-based administration, moderation workflow, suspensions, and audit logs.
-- Admins are a superset of moderators; venue managers remain a separate role.

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('moderator', 'admin')),
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_suspensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 500),
  suspended_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  suspended_at timestamptz NOT NULL DEFAULT now(),
  suspended_until timestamptz,
  lifted_at timestamptz,
  lifted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CHECK (suspended_until IS NULL OR suspended_until > suspended_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_suspensions_one_active_idx
  ON public.user_suspensions(user_id) WHERE lifted_at IS NULL;
CREATE INDEX IF NOT EXISTS user_suspensions_active_until_idx
  ON public.user_suspensions(suspended_until) WHERE lifted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.moderation_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS moderation_audit_actor_created_idx
  ON public.moderation_audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS moderation_audit_target_idx
  ON public.moderation_audit_log(target_type, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings(key, value)
VALUES ('moderation_auto_hide_threshold', '3'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.current_app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION private.can_moderate()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(private.current_app_role() IN ('moderator', 'admin'), false);
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(private.current_app_role() = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION private.is_user_suspended(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_suspensions
    WHERE user_id = p_user_id
      AND lifted_at IS NULL
      AND (suspended_until IS NULL OR suspended_until > now())
  );
$$;

CREATE OR REPLACE FUNCTION private.is_current_user_suspended()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_user_suspended(auth.uid());
$$;

REVOKE ALL ON FUNCTION private.current_app_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_moderate() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_user_suspended(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_current_user_suspended() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.current_app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_moderate() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_user_suspended(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_current_user_suspended() TO authenticated;

DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.is_admin());

DROP POLICY IF EXISTS "Users can view own suspension" ON public.user_suspensions;
CREATE POLICY "Users can view own suspension" ON public.user_suspensions
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.can_moderate());

DROP POLICY IF EXISTS "Admins can view audit log" ON public.moderation_audit_log;
CREATE POLICY "Admins can view audit log" ON public.moderation_audit_log
FOR SELECT TO authenticated USING (private.is_admin());

DROP POLICY IF EXISTS "Authenticated users can view app settings" ON public.app_settings;
CREATE POLICY "Authenticated users can view app settings" ON public.app_settings
FOR SELECT TO authenticated
USING (private.is_admin() OR key = 'moderation_auto_hide_threshold');

-- Expand purpose-limited reads for the moderation team. Writes still happen
-- through validated functions below.
DROP POLICY IF EXISTS "Purpose-limited profile visibility" ON public.profiles;
CREATE POLICY "Purpose-limited profile visibility" ON public.profiles
FOR SELECT TO authenticated
USING (
  private.is_admin()
  OR id = auth.uid()
  OR (
    private.current_app_role() = 'moderator'
    AND (
      EXISTS (
        SELECT 1 FROM public.note_reports report
        WHERE report.reporter_id = profiles.id
      )
      OR EXISTS (
        SELECT 1
        FROM public.note_reports report
        JOIN public.notes reported_note ON reported_note.id = report.note_id
        WHERE reported_note.author_id = profiles.id
      )
      OR EXISTS (
        SELECT 1 FROM public.user_reports report
        WHERE report.reporter_id = profiles.id OR report.reported_id = profiles.id
      )
      OR EXISTS (
        SELECT 1 FROM public.user_suspensions suspension
        WHERE suspension.user_id = profiles.id OR suspension.suspended_by = profiles.id
      )
    )
  )
  OR (
    NOT public.is_current_user_venue_manager()
    AND NOT private.is_venue_manager(id)
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

DROP POLICY IF EXISTS "Authenticated students can view visible notes" ON public.notes;
DROP POLICY IF EXISTS "Students and moderators can view notes" ON public.notes;
CREATE POLICY "Students and moderators can view notes" ON public.notes
FOR SELECT TO authenticated
USING (
  author_id = auth.uid()
  OR (
    private.can_moderate()
    AND EXISTS (
      SELECT 1 FROM public.note_reports report WHERE report.note_id = notes.id
    )
  )
  OR (
    moderation_status = 'visible'
    AND NOT public.is_current_user_venue_manager()
    AND NOT private.can_moderate()
  )
);

DROP POLICY IF EXISTS "Users can view their note reports" ON public.note_reports;
DROP POLICY IF EXISTS "Users and moderators can view note reports" ON public.note_reports;
CREATE POLICY "Users and moderators can view note reports" ON public.note_reports
FOR SELECT TO authenticated
USING (reporter_id = auth.uid() OR private.can_moderate());

DROP POLICY IF EXISTS "Users can view their user reports" ON public.user_reports;
DROP POLICY IF EXISTS "Users and moderators can view user reports" ON public.user_reports;
CREATE POLICY "Users and moderators can view user reports" ON public.user_reports
FOR SELECT TO authenticated
USING (reporter_id = auth.uid() OR private.can_moderate());

-- Reporters may create reports, but only moderation functions may change their
-- status after submission.
DROP POLICY IF EXISTS "Users can update their user reports" ON public.user_reports;

DROP POLICY IF EXISTS "Managers can view their venue assignment" ON public.venue_managers;
DROP POLICY IF EXISTS "Managers and admins can view venue assignments" ON public.venue_managers;
CREATE POLICY "Managers and admins can view venue assignments" ON public.venue_managers
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.is_admin());

CREATE OR REPLACE FUNCTION private.prevent_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Moderation audit entries are immutable';
END;
$$;

DROP TRIGGER IF EXISTS moderation_audit_immutable ON public.moderation_audit_log;
CREATE TRIGGER moderation_audit_immutable
BEFORE UPDATE OR DELETE ON public.moderation_audit_log
FOR EACH ROW EXECUTE FUNCTION private.prevent_audit_mutation();

CREATE OR REPLACE FUNCTION private.block_suspended_user_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND private.is_current_user_suspended() THEN
    RAISE EXCEPTION 'Account suspended';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'sessions', 'matches', 'messages', 'notes', 'note_likes', 'occupancy_reports',
    'study_sessions', 'note_reports', 'user_blocks', 'user_reports',
    'venue_checkins', 'coupons'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS block_suspended_user_write ON public.%I', v_table);
    EXECUTE format(
      'CREATE TRIGGER block_suspended_user_write BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.block_suspended_user_write()',
      v_table
    );
  END LOOP;
END;
$$;

-- Staff accounts are operational identities, not student identities. Block
-- student-only activity even when an old match or search predates assignment.
CREATE OR REPLACE FUNCTION private.block_staff_student_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND private.can_moderate() THEN
    RAISE EXCEPTION 'Student account required';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'sessions', 'matches', 'messages', 'note_likes', 'occupancy_reports',
    'study_sessions', 'user_blocks', 'venue_checkins', 'coupons'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS block_staff_student_activity ON public.%I', v_table);
    EXECUTE format(
      'CREATE TRIGGER block_staff_student_activity BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.block_staff_student_activity()',
      v_table
    );
  END LOOP;
END;
$$;

-- Never create or reactivate a match that includes an operational or
-- suspended account, even if a caller bypasses candidate discovery and calls
-- the swipe RPC with a previously observed session UUID.
CREATE OR REPLACE FUNCTION private.block_ineligible_match_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IN ('pending', 'accepted') AND (
    EXISTS (
      SELECT 1 FROM public.user_roles role_row
      WHERE role_row.user_id IN (NEW.user_a, NEW.user_b)
    )
    OR private.is_venue_manager(NEW.user_a)
    OR private.is_venue_manager(NEW.user_b)
    OR private.is_user_suspended(NEW.user_a)
    OR private.is_user_suspended(NEW.user_b)
  ) THEN
    RAISE EXCEPTION 'A match participant is unavailable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_ineligible_match_participants ON public.matches;
CREATE TRIGGER block_ineligible_match_participants
BEFORE INSERT OR UPDATE OF user_a, user_b, status ON public.matches
FOR EACH ROW EXECUTE FUNCTION private.block_ineligible_match_participants();

CREATE OR REPLACE FUNCTION public.report_user(
  p_reported_user_id uuid,
  p_reason text,
  p_details text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF private.is_current_user_suspended() THEN RAISE EXCEPTION 'Account suspended'; END IF;
  IF private.is_venue_manager(v_user) OR private.can_moderate() THEN RAISE EXCEPTION 'Student account required'; END IF;
  IF p_reported_user_id = v_user THEN RAISE EXCEPTION 'You cannot report yourself'; END IF;
  IF p_reason NOT IN ('spam', 'harassment', 'unsafe', 'impersonation', 'copyright', 'other') THEN RAISE EXCEPTION 'Invalid report reason'; END IF;
  IF char_length(coalesce(p_details, '')) > 500 THEN RAISE EXCEPTION 'Report details are too long'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_reported_user_id) THEN RAISE EXCEPTION 'User not found'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_reported_user_id)
     OR private.is_venue_manager(p_reported_user_id) THEN
    RAISE EXCEPTION 'This account cannot be reported through the student workflow';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.matches
    WHERE (user_a = v_user AND user_b = p_reported_user_id)
       OR (user_a = p_reported_user_id AND user_b = v_user)
  ) THEN RAISE EXCEPTION 'Only a current or past study partner can be reported'; END IF;

  INSERT INTO public.user_reports(reporter_id, reported_id, reason, details, status, created_at)
  VALUES (v_user, p_reported_user_id, p_reason, nullif(trim(p_details), ''), 'open', now())
  ON CONFLICT (reporter_id, reported_id)
  DO UPDATE SET reason = EXCLUDED.reason, details = EXCLUDED.details, status = 'open', created_at = now();
END;
$$;

-- Candidate discovery keeps its privileged core in the non-exposed schema.
-- The public wrapper is SECURITY INVOKER and rejects staff/suspended accounts.
-- The conditional move also lets this migration recover cleanly if it was
-- interrupted after moving or renaming the original function.
DO $$
BEGIN
  IF to_regprocedure('private.find_match_candidates_core(uuid)') IS NULL THEN
    IF to_regprocedure('private.find_match_candidates_private(uuid)') IS NOT NULL THEN
      EXECUTE 'ALTER FUNCTION private.find_match_candidates_private(uuid) RENAME TO find_match_candidates_core';
    ELSIF to_regprocedure('public.find_match_candidates_private(uuid)') IS NOT NULL THEN
      EXECUTE 'ALTER FUNCTION public.find_match_candidates_private(uuid) SET SCHEMA private';
      EXECUTE 'ALTER FUNCTION private.find_match_candidates_private(uuid) RENAME TO find_match_candidates_core';
    ELSE
      RAISE EXCEPTION 'Matching candidate function was not found; run migrations 009-014 first';
    END IF;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION private.find_match_candidates_core(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.find_match_candidates_core(uuid) TO authenticated;

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
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF private.is_current_user_suspended() THEN RAISE EXCEPTION 'Account suspended'; END IF;
  IF private.can_moderate() OR private.is_venue_manager(auth.uid()) THEN RAISE EXCEPTION 'Student account required'; END IF;
  RETURN QUERY
  SELECT candidate.*
  FROM private.find_match_candidates_core(p_session_id) AS candidate
  WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles role_row
      WHERE role_row.user_id = candidate.candidate_user_id
    )
    AND NOT private.is_user_suspended(candidate.candidate_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.moderate_note_report(p_report_id uuid, p_decision text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_report public.note_reports%ROWTYPE;
BEGIN
  IF v_actor IS NULL OR NOT private.can_moderate() THEN RAISE EXCEPTION 'Moderator access required'; END IF;
  IF p_decision NOT IN ('hide', 'restore', 'dismiss') THEN RAISE EXCEPTION 'Invalid moderation decision'; END IF;

  SELECT * INTO v_report FROM public.note_reports WHERE id = p_report_id AND status = 'open' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Report not found'; END IF;

  IF p_decision = 'hide' THEN
    UPDATE public.notes SET moderation_status = 'hidden' WHERE id = v_report.note_id;
    UPDATE public.note_reports SET status = 'reviewed' WHERE note_id = v_report.note_id AND status = 'open';
  ELSIF p_decision = 'restore' THEN
    UPDATE public.notes SET moderation_status = 'visible' WHERE id = v_report.note_id;
    UPDATE public.note_reports SET status = 'reviewed' WHERE id = p_report_id;
  ELSE
    UPDATE public.note_reports SET status = 'dismissed' WHERE id = p_report_id;
  END IF;

  INSERT INTO public.moderation_audit_log(actor_id, action, target_type, target_id, details)
  VALUES (v_actor, 'note_report_' || p_decision, 'note', v_report.note_id, jsonb_build_object('report_id', p_report_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_user_report(p_report_id uuid, p_decision text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_report public.user_reports%ROWTYPE;
BEGIN
  IF v_actor IS NULL OR NOT private.can_moderate() THEN RAISE EXCEPTION 'Moderator access required'; END IF;
  IF p_decision NOT IN ('reviewed', 'dismissed') THEN RAISE EXCEPTION 'Invalid moderation decision'; END IF;
  SELECT * INTO v_report FROM public.user_reports WHERE id = p_report_id AND status = 'open' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Report not found'; END IF;
  UPDATE public.user_reports SET status = p_decision WHERE id = p_report_id;
  INSERT INTO public.moderation_audit_log(actor_id, action, target_type, target_id, details)
  VALUES (v_actor, 'user_report_' || p_decision, 'user', v_report.reported_id, jsonb_build_object('report_id', p_report_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_suspension(
  p_user_id uuid,
  p_suspended boolean,
  p_reason text DEFAULT NULL,
  p_suspended_until timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_role text := private.current_app_role();
  v_target_role text;
BEGIN
  IF v_actor IS NULL OR NOT private.can_moderate() THEN RAISE EXCEPTION 'Moderator access required'; END IF;
  IF p_user_id = v_actor THEN RAISE EXCEPTION 'You cannot suspend your own account'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN RAISE EXCEPTION 'User not found'; END IF;
  SELECT role INTO v_target_role FROM public.user_roles WHERE user_id = p_user_id;
  IF v_target_role = 'admin' OR (v_actor_role = 'moderator' AND v_target_role IS NOT NULL) THEN
    RAISE EXCEPTION 'You cannot suspend this privileged account';
  END IF;
  IF v_actor_role = 'moderator' AND EXISTS (SELECT 1 FROM public.venue_managers WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Only an admin can suspend a venue manager';
  END IF;

  IF p_suspended THEN
    IF char_length(trim(coalesce(p_reason, ''))) < 3 OR char_length(p_reason) > 500 THEN RAISE EXCEPTION 'A valid suspension reason is required'; END IF;
    IF p_suspended_until IS NOT NULL AND p_suspended_until <= now() THEN RAISE EXCEPTION 'Suspension end must be in the future'; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
    UPDATE public.user_suspensions
      SET reason = trim(p_reason), suspended_by = v_actor, suspended_at = now(), suspended_until = p_suspended_until, lifted_at = NULL, lifted_by = NULL
      WHERE user_id = p_user_id AND lifted_at IS NULL;
    IF NOT FOUND THEN
      INSERT INTO public.user_suspensions(user_id, reason, suspended_by, suspended_until)
      VALUES (p_user_id, trim(p_reason), v_actor, p_suspended_until);
    END IF;
  ELSE
    UPDATE public.user_suspensions SET lifted_at = now(), lifted_by = v_actor
    WHERE user_id = p_user_id AND lifted_at IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'Active suspension not found'; END IF;
  END IF;

  INSERT INTO public.moderation_audit_log(actor_id, action, target_type, target_id, details)
  VALUES (v_actor, CASE WHEN p_suspended THEN 'user_suspended' ELSE 'user_suspension_lifted' END, 'user', p_user_id,
    jsonb_build_object('reason', p_reason, 'suspended_until', p_suspended_until));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(p_user_id uuid, p_role text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL OR NOT private.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_user_id = v_actor THEN RAISE EXCEPTION 'You cannot change your own admin role'; END IF;
  IF p_role IS NOT NULL AND p_role NOT IN ('moderator', 'admin') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  IF private.is_venue_manager(p_user_id) AND p_role IS NOT NULL THEN RAISE EXCEPTION 'Venue managers cannot receive staff roles'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN RAISE EXCEPTION 'User not found'; END IF;
  IF p_role IS NOT NULL AND private.is_user_suspended(p_user_id) THEN RAISE EXCEPTION 'Suspended accounts cannot receive staff roles'; END IF;

  IF p_role IS NULL THEN
    DELETE FROM public.user_roles WHERE user_id = p_user_id;
  ELSE
    INSERT INTO public.user_roles(user_id, role, assigned_by, assigned_at)
    VALUES (p_user_id, p_role, v_actor, now())
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, assigned_by = v_actor, assigned_at = now();
  END IF;

  INSERT INTO public.moderation_audit_log(actor_id, action, target_type, target_id, details)
  VALUES (v_actor, 'staff_role_changed', 'user', p_user_id, jsonb_build_object('role', p_role));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_assign_venue_manager(p_user_id uuid, p_venue_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL OR NOT private.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id) THEN RAISE EXCEPTION 'Staff accounts cannot manage venues'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN RAISE EXCEPTION 'User not found'; END IF;
  IF p_venue_id IS NOT NULL AND private.is_user_suspended(p_user_id) THEN RAISE EXCEPTION 'Suspended accounts cannot manage venues'; END IF;

  DELETE FROM public.venue_managers WHERE user_id = p_user_id;
  IF p_venue_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.venues WHERE id = p_venue_id) THEN RAISE EXCEPTION 'Venue not found'; END IF;
    IF EXISTS (SELECT 1 FROM public.venue_managers WHERE venue_id = p_venue_id) THEN RAISE EXCEPTION 'Venue already has a manager'; END IF;
    INSERT INTO public.venue_managers(user_id, venue_id) VALUES (p_user_id, p_venue_id);
  END IF;

  INSERT INTO public.moderation_audit_log(actor_id, action, target_type, target_id, details)
  VALUES (v_actor, 'venue_manager_assignment_changed', 'user', p_user_id, jsonb_build_object('venue_id', p_venue_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_venue(
  p_venue_id uuid,
  p_name text,
  p_address text,
  p_type text,
  p_distance double precision
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_actor IS NULL OR NOT private.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF char_length(trim(coalesce(p_name, ''))) < 2 OR char_length(p_name) > 120 THEN RAISE EXCEPTION 'Invalid venue name'; END IF;
  IF char_length(coalesce(p_address, '')) > 240 OR char_length(coalesce(p_type, '')) > 80 THEN RAISE EXCEPTION 'Venue details are too long'; END IF;
  IF p_distance IS NULL OR p_distance < 0 OR p_distance > 100 THEN RAISE EXCEPTION 'Invalid venue distance'; END IF;

  IF p_venue_id IS NULL THEN
    INSERT INTO public.venues(name, address, type, distance, occupancy, is_open)
    VALUES (trim(p_name), nullif(trim(p_address), ''), coalesce(nullif(trim(p_type), ''), 'study_space'), p_distance, 0, true)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.venues SET name = trim(p_name), address = nullif(trim(p_address), ''), type = coalesce(nullif(trim(p_type), ''), type), distance = p_distance
    WHERE id = p_venue_id RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Venue not found'; END IF;
  END IF;

  INSERT INTO public.moderation_audit_log(actor_id, action, target_type, target_id, details)
  VALUES (v_actor, CASE WHEN p_venue_id IS NULL THEN 'venue_created' ELSE 'venue_updated' END, 'venue', v_id, jsonb_build_object('name', trim(p_name)));
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_setting(p_key text, p_value jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_threshold integer;
BEGIN
  IF v_actor IS NULL OR NOT private.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_key <> 'moderation_auto_hide_threshold' THEN RAISE EXCEPTION 'Unsupported setting'; END IF;
  v_threshold := (p_value #>> '{}')::integer;
  IF v_threshold < 1 OR v_threshold > 20 THEN RAISE EXCEPTION 'Threshold must be between 1 and 20'; END IF;
  INSERT INTO public.app_settings(key, value, updated_by, updated_at)
  VALUES (p_key, to_jsonb(v_threshold), v_actor, now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = v_actor, updated_at = now();
  INSERT INTO public.moderation_audit_log(actor_id, action, target_type, details)
  VALUES (v_actor, 'app_setting_changed', 'setting', jsonb_build_object('key', p_key, 'value', v_threshold));
END;
$$;

-- Use the configurable auto-hide threshold for new note reports.
CREATE OR REPLACE FUNCTION public.report_note(p_note_id uuid, p_reason text, p_details text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_report_count integer;
  v_note_author uuid;
  v_threshold integer := 3;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF private.is_current_user_suspended() THEN RAISE EXCEPTION 'Account suspended'; END IF;
  IF private.is_venue_manager(v_user) OR private.can_moderate() THEN RAISE EXCEPTION 'Student account required'; END IF;
  IF p_reason NOT IN ('spam', 'harassment', 'unsafe', 'impersonation', 'copyright', 'other') THEN RAISE EXCEPTION 'Invalid report reason'; END IF;
  IF char_length(coalesce(p_details, '')) > 500 THEN RAISE EXCEPTION 'Report details are too long'; END IF;
  SELECT author_id INTO v_note_author FROM public.notes WHERE id = p_note_id AND moderation_status = 'visible';
  IF v_note_author IS NULL THEN RAISE EXCEPTION 'Note not found'; END IF;
  IF v_note_author = v_user THEN RAISE EXCEPTION 'You cannot report your own note'; END IF;
  SELECT COALESCE(
    (SELECT (value #>> '{}')::integer FROM public.app_settings WHERE key = 'moderation_auto_hide_threshold'),
    3
  ) INTO v_threshold;

  INSERT INTO public.note_reports(reporter_id, note_id, reason, details)
  VALUES (v_user, p_note_id, p_reason, nullif(trim(p_details), ''))
  ON CONFLICT (reporter_id, note_id)
  DO UPDATE SET reason = EXCLUDED.reason, details = EXCLUDED.details, status = 'open', created_at = now();
  SELECT count(*) INTO v_report_count FROM public.note_reports WHERE note_id = p_note_id AND status = 'open';
  IF v_report_count >= v_threshold THEN UPDATE public.notes SET moderation_status = 'hidden' WHERE id = p_note_id; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_note_download(p_note_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF private.is_current_user_suspended() THEN RAISE EXCEPTION 'Account suspended'; END IF;
  IF private.can_moderate() OR private.is_venue_manager(v_user) THEN RAISE EXCEPTION 'Student account required'; END IF;
  UPDATE public.notes SET downloads_count = downloads_count + 1
  WHERE id = p_note_id AND (moderation_status = 'visible' OR author_id = v_user);
  IF NOT FOUND THEN RAISE EXCEPTION 'Note not found'; END IF;
END;
$$;

-- Direct note mutations remain owner-only and are unavailable to staff. The
-- moderation RPCs bypass these policies but still record every decision.
DROP POLICY IF EXISTS "Students can insert own notes" ON public.notes;
CREATE POLICY "Students can insert own notes" ON public.notes
FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND NOT public.is_current_user_venue_manager() AND NOT private.can_moderate() AND NOT private.is_current_user_suspended());

DROP POLICY IF EXISTS "Students can update own notes" ON public.notes;
CREATE POLICY "Students can update own notes" ON public.notes
FOR UPDATE TO authenticated
USING (author_id = auth.uid() AND NOT public.is_current_user_venue_manager() AND NOT private.can_moderate() AND NOT private.is_current_user_suspended())
WITH CHECK (author_id = auth.uid() AND NOT public.is_current_user_venue_manager() AND NOT private.can_moderate() AND NOT private.is_current_user_suspended());

DROP POLICY IF EXISTS "Students can delete own notes" ON public.notes;
CREATE POLICY "Students can delete own notes" ON public.notes
FOR DELETE TO authenticated
USING (author_id = auth.uid() AND NOT public.is_current_user_venue_manager() AND NOT private.can_moderate() AND NOT private.is_current_user_suspended());

DROP POLICY IF EXISTS "Users can create user reports" ON public.user_reports;

DROP POLICY IF EXISTS "Students can upload their own note files" ON storage.objects;
CREATE POLICY "Students can upload their own note files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'notes'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND NOT public.is_current_user_venue_manager()
  AND NOT private.can_moderate()
  AND NOT private.is_current_user_suspended()
);

DROP POLICY IF EXISTS "Authenticated users can read note files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated students can read note files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read permitted note files" ON storage.objects;
CREATE POLICY "Authenticated users can read permitted note files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'notes'
  AND NOT public.is_current_user_venue_manager()
  AND NOT private.is_current_user_suspended()
  AND EXISTS (
    SELECT 1 FROM public.notes note WHERE note.file_url = storage.objects.name
  )
);

DROP POLICY IF EXISTS "Users can delete their own note files" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete their own note files" ON storage.objects;
CREATE POLICY "Students can delete their own note files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'notes'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND NOT public.is_current_user_venue_manager()
  AND NOT private.can_moderate()
  AND NOT private.is_current_user_suspended()
);

REVOKE ALL ON FUNCTION public.report_user(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.moderate_note_report(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.resolve_user_report(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_user_suspension(uuid, boolean, text, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_assign_venue_manager(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_upsert_venue(uuid, text, text, text, double precision) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_setting(text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_note(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.register_note_download(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.find_match_candidates_private(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_user(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_note_report(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_user_report(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_suspension(uuid, boolean, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_venue_manager(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_venue(uuid, text, text, text, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_setting(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_note(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_note_download(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_match_candidates_private(uuid) TO authenticated;

-- Bootstrap the first admin manually after this migration:
-- INSERT INTO public.user_roles(user_id, role)
-- VALUES ('ADMIN_PROFILE_UUID', 'admin');
