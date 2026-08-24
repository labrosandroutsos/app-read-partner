-- Run after 012_privacy_and_rls_hardening.sql in the Supabase SQL editor.
-- This script is read-only. It raises an error if a privacy invariant is missing.

DO $$
DECLARE
  v_missing_rls text;
  v_public_policy text;
BEGIN
  SELECT string_agg(c.relname, ', ' ORDER BY c.relname)
  INTO v_missing_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = ANY (ARRAY[
      'profiles', 'sessions', 'matches', 'messages', 'notes', 'note_likes',
      'coupons', 'occupancy_reports', 'study_sessions', 'note_reports',
      'user_blocks', 'user_reports', 'venue_managers', 'venue_checkins'
    ])
    AND NOT c.relrowsecurity;

  IF v_missing_rls IS NOT NULL THEN
    RAISE EXCEPTION 'RLS is disabled on: %', v_missing_rls;
  END IF;

  SELECT string_agg(format('%I.%I (%s)', schemaname, tablename, policyname), ', ')
  INTO v_public_policy
  FROM pg_policies
  WHERE schemaname IN ('public', 'storage')
    AND tablename = ANY (ARRAY[
      'profiles', 'sessions', 'matches', 'messages', 'notes', 'note_likes',
      'coupons', 'occupancy_reports', 'study_sessions', 'note_reports',
      'user_blocks', 'user_reports', 'venue_managers', 'venue_checkins', 'objects'
    ])
    AND cmd = 'SELECT'
    AND (roles @> ARRAY['public']::name[] OR roles @> ARRAY['anon']::name[]);

  IF v_public_policy IS NOT NULL THEN
    RAISE EXCEPTION 'Sensitive SELECT policies still target public/anon: %', v_public_policy;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname IN (
        'Venue managers can view assigned schedules',
        'Venue managers can view assigned checkins',
        'Venue managers can view assigned occupancy',
        'Match participants can update schedules'
      )
  ) THEN
    RAISE EXCEPTION 'A raw manager/schedule policy still exists';
  END IF;

  IF has_function_privilege('anon', 'public.find_match_candidates_private(uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.get_managed_venue_dashboard()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous users can execute a private RPC';
  END IF;

  IF NOT has_function_privilege('authenticated', 'public.find_match_candidates_private(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.get_managed_venue_dashboard()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Authenticated users are missing private RPC access';
  END IF;
END;
$$;

SELECT 'RLS privacy audit passed' AS result;
