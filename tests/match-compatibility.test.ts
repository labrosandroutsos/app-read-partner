import { describe, expect, it } from "vitest"
import { calculateMatchCompatibility, type MatchCompatibilityInput } from "../lib/match-compatibility"

const base: MatchCompatibilityInput = {
  ownStart: "2026-08-25T10:00:00.000Z",
  ownEnd: "2026-08-25T12:00:00.000Z",
  candidateStart: "2026-08-25T10:00:00.000Z",
  candidateEnd: "2026-08-25T12:00:00.000Z",
  ownStudyStyle: "quiet",
  candidateStudyStyle: "quiet",
  ownLanguage: "el",
  candidateLanguage: "el",
  ownVenueId: "venue-a",
  candidateVenueId: "venue-a",
  ownSemester: 4,
  candidateSemester: 4,
  candidateDistanceKm: 1,
  maximumDistanceKm: 5,
}

describe("match compatibility", () => {
  it("awards a perfect score to a fully compatible candidate", () => {
    expect(calculateMatchCompatibility(base)).toMatchObject({ timeOverlap: 100, compatibilityScore: 100 })
  })

  it("rejects candidates outside the selected distance", () => {
    expect(calculateMatchCompatibility({ ...base, candidateDistanceKm: 5.1 })).toBeNull()
  })

  it("rejects overlap below the 25 percent threshold", () => {
    expect(calculateMatchCompatibility({
      ...base,
      candidateStart: "2026-08-25T11:40:00.000Z",
      candidateEnd: "2026-08-25T12:30:00.000Z",
    })).toBeNull()
  })

  it("scores flexible preferences without rejecting the candidate", () => {
    const result = calculateMatchCompatibility({
      ...base,
      ownStudyStyle: "either",
      candidateStudyStyle: "social",
      ownLanguage: "either",
      candidateLanguage: "en",
      ownVenueId: null,
    })

    expect(result).not.toBeNull()
    expect(result?.compatibilityReasons).toContain("Flexible study space")
    expect(result?.compatibilityScore).toBeGreaterThanOrEqual(90)
  })

  it("rejects invalid or reversed date ranges", () => {
    expect(calculateMatchCompatibility({ ...base, ownEnd: base.ownStart })).toBeNull()
    expect(calculateMatchCompatibility({ ...base, candidateStart: "invalid" })).toBeNull()
  })
})


it("does not penalise different semesters in general study mode", () => {
  expect(calculateMatchCompatibility({...base,generalStudy:true,candidateSemester:13})?.compatibilityScore)
    .toBe(calculateMatchCompatibility({...base,generalStudy:true,candidateSemester:1})?.compatibilityScore)
  expect(calculateMatchCompatibility({...base,candidateSemester:13})?.compatibilityScore).toBeLessThan(100)
})
