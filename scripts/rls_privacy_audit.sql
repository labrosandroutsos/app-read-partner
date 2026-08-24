-- Run after 012_privacy_and_rls_hardening.sql in the Supabase SQL editor.
-- This script is read-only. It raises an error if a privacy invariant is missing.

DO $$
DECLARE
  v_missing_table text;
  v_missing_trigger text;
  v_missing_rls text;
  v_public_policy text;
BEGIN
  SELECT string_agg(required_table, ', ' ORDER BY required_table)
  INTO v_missing_table
  FROM unnest(ARRAY[
    'profiles', 'sessions', 'matches', 'messages', 'notes', 'note_likes',
    'coupons', 'occupancy_reports', 'study_sessions', 'note_reports',
    'user_blocks', 'user_reports', 'venue_managers', 'venue_checkins',
    'user_roles', 'user_suspensions', 'moderation_audit_log', 'app_settings'
  ]) AS required_table
  WHERE to_regclass('public.' || required_table) IS NULL;

  IF v_missing_table IS NOT NULL THEN
    RAISE EXCEPTION 'Required tables are missing: %', v_missing_table;
  END IF;

  SELECT string_agg(c.relname, ', ' ORDER BY c.relname)
  INTO v_missing_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = ANY (ARRAY[
      'profiles', 'sessions', 'matches', 'messages', 'notes', 'note_likes',
      'coupons', 'occupancy_reports', 'study_sessions', 'note_reports',
      'user_blocks', 'user_reports', 'venue_managers', 'venue_checkins',
      'user_roles', 'user_suspensions', 'moderation_audit_log', 'app_settings'
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
      'user_blocks', 'user_reports', 'venue_managers', 'venue_checkins', 'objects',
      'user_roles', 'user_suspensions', 'moderation_audit_log', 'app_settings'
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
     OR has_function_privilege('anon', 'public.get_managed_venue_dashboard()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.is_current_user_venue_manager()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous users can execute a private RPC';
  END IF;

  IF has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE') THEN
    RAISE EXCEPTION 'A trigger or administrative function is exposed through the API';
  END IF;

  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    IF has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE')
       OR has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE') THEN
      RAISE EXCEPTION 'RLS administration function is exposed through the API';
    END IF;
  END IF;

  IF to_regprocedure('public.is_venue_manager(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'Internal venue role helper remains in the exposed public schema';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'is_current_user_venue_manager'
      AND p.prosecdef
  ) THEN
    RAISE EXCEPTION 'Current-manager helper still uses SECURITY DEFINER';
  END IF;

  IF NOT has_function_privilege('authenticated', 'public.find_match_candidates_private(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.get_managed_venue_dashboard()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Authenticated users are missing private RPC access';
  END IF;

  IF has_function_privilege('anon', 'public.moderate_note_report(uuid,text)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.resolve_user_report(uuid,text)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.set_user_suspension(uuid,boolean,text,timestamp with time zone)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.admin_set_user_role(uuid,text)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.admin_assign_venue_manager(uuid,uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.admin_upsert_venue(uuid,text,text,text,double precision)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.admin_update_setting(text,jsonb)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.report_user(uuid,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous users can execute a moderation/admin RPC';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'moderation_audit_log'
      AND t.tgname = 'moderation_audit_immutable' AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'Immutable moderation audit trigger is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'matches'
      AND t.tgname = 'block_ineligible_match_participants' AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'Ineligible match participant trigger is missing';
  END IF;

  SELECT string_agg(required_table, ', ' ORDER BY required_table)
  INTO v_missing_trigger
  FROM unnest(ARRAY[
    'sessions', 'matches', 'messages', 'notes', 'note_likes', 'occupancy_reports',
    'study_sessions', 'note_reports', 'user_blocks', 'user_reports',
    'venue_checkins', 'coupons'
  ]) AS required_table
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = required_table
      AND t.tgname = 'block_suspended_user_write' AND NOT t.tgisinternal
  );

  IF v_missing_trigger IS NOT NULL THEN
    RAISE EXCEPTION 'Suspension write trigger is missing on: %', v_missing_trigger;
  END IF;
END;
$$;

SELECT 'RLS privacy audit passed' AS result;
