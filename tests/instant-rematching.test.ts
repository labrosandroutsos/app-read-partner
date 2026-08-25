import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const migration = readFileSync(new URL("../scripts/018_instant_rematching.sql", import.meta.url), "utf8")
const safetyMenu = readFileSync(new URL("../components/safety/user-safety-menu.tsx", import.meta.url), "utf8")

describe("instant rematching migration", () => {
  it("removes the database cooldown trigger", () => {
    expect(migration).toContain("DROP TRIGGER IF EXISTS enforce_match_cooldown_trigger ON public.matches")
  })

  it("allows ended pairs back into candidate discovery immediately", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION private.find_match_candidates_core")
    expect(migration).not.toContain("m.status = 'ended'")
    expect(migration).not.toContain("interval '5 minutes'")
  })

  it("does not promise a five-minute delay in the interface", () => {
    expect(safetyMenu).not.toContain("after 5 minutes")
    expect(safetyMenu).toContain("again immediately")
  })
})
