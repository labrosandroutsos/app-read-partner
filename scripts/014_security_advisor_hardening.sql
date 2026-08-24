-- Remediate avoidable SECURITY DEFINER advisor warnings and make future
-- function exposure opt-in. Authenticated application RPCs remain in public
-- intentionally because the app calls them through Supabase's Data API.

-- Trigger/administrative functions are invoked internally, never as RPCs.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated, service_role;
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated, service_role;
  END IF;
END;
$$;

-- Internal RLS helpers belong outside schemas exposed by the Data API.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_venue_manager(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.venue_managers WHERE user_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION private.is_venue_manager(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_venue_manager(uuid) TO authenticated;

-- This check can safely use the caller's own RLS-visible assignment, so it
-- does not need elevated privileges.
CREATE OR REPLACE FUNCTION public.is_current_user_venue_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.venue_managers WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_venue_manager() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_venue_manager() TO authenticated;

-- Rebind profile visibility to the private helper before dropping the exposed
-- variant created by migration 012.
DROP POLICY IF EXISTS "Purpose-limited profile visibility" ON public.profiles;
CREATE POLICY "Purpose-limited profile visibility" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
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

DROP FUNCTION IF EXISTS public.is_venue_manager(uuid);

-- Future functions must be explicitly granted to the exact API role that
-- needs them instead of receiving automatic execution privileges.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;
