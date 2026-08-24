import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const migration = readFileSync(new URL("../scripts/012_privacy_and_rls_hardening.sql", import.meta.url), "utf8")

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
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.find_match_candidates_private(uuid) FROM PUBLIC')
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.find_match_candidates_private(uuid) TO authenticated')
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.get_managed_venue_dashboard() FROM PUBLIC')
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.get_managed_venue_dashboard() TO authenticated')
  })

  it("prevents direct rewriting of protected schedule columns", () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Match participants can update schedules"')
  })
})
