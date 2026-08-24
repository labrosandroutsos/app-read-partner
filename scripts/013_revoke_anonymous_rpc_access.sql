-- Supabase can grant EXECUTE directly to `anon` through default privileges.
-- Revoking PUBLIC alone does not remove that direct grant.

REVOKE ALL ON FUNCTION public.is_venue_manager(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_current_user_venue_manager() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.find_match_candidates_private(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_managed_venue_dashboard() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_venue_manager(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_venue_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_match_candidates_private(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_managed_venue_dashboard() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.register_note_download(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.report_note(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.swipe_on_session(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_match_read(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.propose_study_session(uuid, timestamptz, timestamptz, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.respond_study_session(uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cancel_study_session(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.end_match(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.toggle_venue_checkin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_managed_venue(boolean, integer, integer) FROM anon;
