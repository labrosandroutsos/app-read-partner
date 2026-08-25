import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const migration = readFileSync(new URL("../scripts/019_interest_notifications.sql", import.meta.url), "utf8")

describe("interest notifications migration", () => {
  it("adds a distinct interest notification type", () => {
    expect(migration).toContain("'interest', 'match', 'message', 'schedule_proposal'")
  })

  it("keeps the sender anonymous until the match is mutual", () => {
    expect(migration).toContain("NEW.user_b")
    expect(migration).toContain("'interest',\n    NULL,\n    NULL,")
  })

  it("notifies new and existing pending interests", () => {
    expect(migration).toContain("CREATE TRIGGER create_interest_notifications")
    expect(migration).toContain("WHERE pending_match.status = 'pending'")
    expect(migration).toContain("sender_search.expires_at > now()")
    expect(migration).toContain("recipient_search.expires_at > now()")
  })

  it("resolves the anonymous notification once a match is accepted", () => {
    expect(migration).toContain("CREATE TRIGGER resolve_interest_notifications")
    expect(migration).toContain("OLD.status = 'pending' AND NEW.status = 'accepted'")
  })
})
