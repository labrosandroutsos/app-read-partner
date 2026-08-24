import { describe, expect, it } from "vitest"
import {
  createPrivacyConsent,
  parsePrivacyConsent,
  PRIVACY_CONSENT_VERSION,
} from "../lib/privacy-consent"

describe("privacy consent", () => {
  it("round-trips an explicit analytics choice", () => {
    const decidedAt = new Date("2026-08-24T09:30:00.000Z")
    const consent = createPrivacyConsent(false, decidedAt)

    expect(parsePrivacyConsent(JSON.stringify(consent))).toEqual({
      version: PRIVACY_CONSENT_VERSION,
      analytics: false,
      decidedAt: decidedAt.toISOString(),
    })
  })

  it.each([
    null,
    "",
    "not-json",
    JSON.stringify({ version: 999, analytics: true, decidedAt: new Date().toISOString() }),
    JSON.stringify({ version: PRIVACY_CONSENT_VERSION, analytics: "yes", decidedAt: new Date().toISOString() }),
    JSON.stringify({ version: PRIVACY_CONSENT_VERSION, analytics: true, decidedAt: "not-a-date" }),
  ])("rejects missing, malformed, or stale consent: %s", (value) => {
    expect(parsePrivacyConsent(value)).toBeNull()
  })
})
