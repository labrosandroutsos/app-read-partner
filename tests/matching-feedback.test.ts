import { describe, expect, it } from "vitest"
import { getMatchingEmptyStateKind, getMatchingSearchErrorKind, localizeCompatibilityReason } from "../lib/matching-feedback"

describe("matching empty-state feedback", () => {
  it("prioritizes pending mutual interest", () => {
    expect(getMatchingEmptyStateKind({ initialCandidateCount: 2, activeMatchCount: 1, pendingInterestCount: 0, sentInterestCount: 1 })).toBe("waiting")
    expect(getMatchingEmptyStateKind({ initialCandidateCount: 0, activeMatchCount: 0, pendingInterestCount: 2, sentInterestCount: 0 })).toBe("waiting")
  })

  it("explains when existing matches may hide previous partners", () => {
    expect(getMatchingEmptyStateKind({ initialCandidateCount: 0, activeMatchCount: 1, pendingInterestCount: 0, sentInterestCount: 0 })).toBe("existing-match")
  })

  it("distinguishes an exhausted stack from an initially empty search", () => {
    expect(getMatchingEmptyStateKind({ initialCandidateCount: 3, activeMatchCount: 0, pendingInterestCount: 0, sentInterestCount: 0 })).toBe("reviewed-all")
    expect(getMatchingEmptyStateKind({ initialCandidateCount: 0, activeMatchCount: 0, pendingInterestCount: 0, sentInterestCount: 0 })).toBe("no-candidates")
  })

  it("turns known matching failures into actionable states", () => {
    expect(getMatchingSearchErrorKind("Student account required")).toBe("student-account")
    expect(getMatchingSearchErrorKind("Search session not found")).toBe("expired")
    expect(getMatchingSearchErrorKind("Connection failed")).toBe("generic")
  })

  it("localizes compatibility explanations without changing English", () => {
    expect(localizeCompatibilityReason("Same study space", "el")).toBe("Ίδιος χώρος μελέτης")
    expect(localizeCompatibilityReason("75% time overlap", "el")).toBe("75% χρονική επικάλυψη")
    expect(localizeCompatibilityReason("Compatible language", "en")).toBe("Compatible language")
  })
})
