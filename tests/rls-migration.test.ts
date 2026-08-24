import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const migration = readFileSync(new URL("../scripts/012_privacy_and_rls_hardening.sql", import.meta.url), "utf8")
const anonymousRpcMigration = readFileSync(new URL("../scripts/013_revoke_anonymous_rpc_access.sql", import.meta.url), "utf8")
const advisorMigration = readFileSync(new URL("../scripts/014_security_advisor_hardening.sql", import.meta.url), "utf8")
const administrationMigration = readFileSync(new URL("../scripts/015_admin_and_moderation.sql", import.meta.url), "utf8")

describe("privacy hardening migration", () => {
  it("removes anonymous reads from sensitive discovery tables", () => {
    expect(migration).toContain('FOR SELECT TO authenticated')
    expect(migration).toContain('DROP POLICY IF EXISTS "Profiles are viewable by everyone"')
    expect(migration).toContain('DROP POLICY IF EXISTS "Sessions are viewable by everyone for matching"')
    expect(migration).toContain('DROP POLICY IF EXISTS "Occupancy reports are viewable by everyone"')
  })

  it("limits profile reads to a concrete relationship", () => {
    expect(migration).toContain('CREATE POLICY "Purpose-limited profile visibility"')
    expect(migration).toContain('SELECT 1 FROM public.matches m')
    expect(migration).toContain('SELECT 1 FROM public.notes n')
    expect(migration).toContain('SELECT 1 FROM public.user_blocks b')
  })

  it("removes direct manager access to participant rows", () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Venue managers can view assigned schedules"')
    expect(migration).toContain('DROP POLICY IF EXISTS "Venue managers can view assigned checkins"')
    expect(migration).toContain('DROP POLICY IF EXISTS "Venue managers can view assigned occupancy"')
    expect(migration).toContain('get_managed_venue_dashboard')
  })

  it("makes sensitive RPCs authenticated-only", () => {
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.find_match_candidates_private(uuid) FROM PUBLIC, anon')
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.find_match_candidates_private(uuid) TO authenticated')
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.get_managed_venue_dashboard() FROM PUBLIC, anon')
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.get_managed_venue_dashboard() TO authenticated')
    expect(anonymousRpcMigration).toContain('FROM PUBLIC, anon')
    expect(anonymousRpcMigration).toContain('REVOKE EXECUTE ON FUNCTION public.swipe_on_session(uuid, uuid) FROM anon')
  })

  it("prevents direct rewriting of protected schedule columns", () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Match participants can update schedules"')
  })

  it("keeps trigger helpers out of the exposed API", () => {
    expect(advisorMigration).toContain('REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated, service_role')
    expect(advisorMigration).toContain('REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated, service_role')
    expect(advisorMigration).toContain('CREATE OR REPLACE FUNCTION private.is_venue_manager')
    expect(advisorMigration).toContain('DROP FUNCTION IF EXISTS public.is_venue_manager(uuid)')
  })

  it("makes future RPC exposure opt-in", () => {
    expect(advisorMigration).toContain('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public')
    expect(advisorMigration).toContain('REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role')
  })

  it("separates moderator and administrator authority", () => {
    expect(administrationMigration).toContain("CHECK (role IN ('moderator', 'admin'))")
    expect(administrationMigration).toContain("IF v_actor IS NULL OR NOT private.can_moderate()")
    expect(administrationMigration).toContain("IF v_actor IS NULL OR NOT private.is_admin()")
    expect(administrationMigration).toContain("You cannot change your own admin role")
    expect(administrationMigration).toContain("private.current_app_role() = 'moderator'")
    expect(administrationMigration).toContain("private.is_admin()")
  })

  it("makes moderation actions auditable and suspensions enforceable", () => {
    expect(administrationMigration).toContain("CREATE TABLE IF NOT EXISTS public.moderation_audit_log")
    expect(administrationMigration).toContain("CREATE TRIGGER moderation_audit_immutable")
    expect(administrationMigration).toContain("CREATE TRIGGER block_suspended_user_write")
    expect(administrationMigration).toContain("CREATE TRIGGER block_staff_student_activity")
  })

  it("keeps staff and suspended accounts out of matchmaking", () => {
    expect(administrationMigration).toContain("private.is_current_user_suspended()")
    expect(administrationMigration).toContain("role_row.user_id = candidate.candidate_user_id")
    expect(administrationMigration).toContain("private.is_user_suspended(candidate.candidate_user_id)")
    expect(administrationMigration).toContain("CREATE TRIGGER block_ineligible_match_participants")
  })

  it("can recover from a partially moved matching function", () => {
    expect(administrationMigration).toContain("to_regprocedure('private.find_match_candidates_core(uuid)')")
    expect(administrationMigration).toContain("to_regprocedure('private.find_match_candidates_private(uuid)')")
    expect(administrationMigration).toContain("to_regprocedure('public.find_match_candidates_private(uuid)')")
  })

  it("keeps admin functions unavailable to anonymous callers", () => {
    expect(administrationMigration).toContain("REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, text) FROM PUBLIC, anon")
    expect(administrationMigration).toContain("REVOKE ALL ON FUNCTION public.admin_assign_venue_manager(uuid, uuid) FROM PUBLIC, anon")
    expect(administrationMigration).toContain("REVOKE ALL ON FUNCTION public.set_user_suspension(uuid, boolean, text, timestamptz) FROM PUBLIC, anon")
  })
})
