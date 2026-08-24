export type StudyStyle = "quiet" | "social" | "either"
export type StudyLanguage = "el" | "en" | "either"

export interface MatchCompatibilityInput {
  ownStart: string
  ownEnd: string
  candidateStart: string
  candidateEnd: string
  ownStudyStyle: StudyStyle
  candidateStudyStyle: StudyStyle
  ownLanguage: StudyLanguage
  candidateLanguage: StudyLanguage
  ownVenueId: string | null
  candidateVenueId: string | null
  ownSemester: number
  candidateSemester: number
  candidateDistanceKm: number
  maximumDistanceKm: number
}

export interface MatchCompatibility {
  timeOverlap: number
  compatibilityScore: number
  compatibilityReasons: string[]
}

export function calculateMatchCompatibility(input: MatchCompatibilityInput): MatchCompatibility | null {
  if (!Number.isFinite(input.candidateDistanceKm) || input.candidateDistanceKm > input.maximumDistanceKm) return null

  const ownStart = new Date(input.ownStart).getTime()
  const ownEnd = new Date(input.ownEnd).getTime()
  const candidateStart = new Date(input.candidateStart).getTime()
  const candidateEnd = new Date(input.candidateEnd).getTime()
  if (![ownStart, ownEnd, candidateStart, candidateEnd].every(Number.isFinite) || ownEnd <= ownStart || candidateEnd <= candidateStart) {
    return null
  }

  const overlapMs = Math.max(0, Math.min(ownEnd, candidateEnd) - Math.max(ownStart, candidateStart))
  const timeOverlap = Math.round(Math.min(100, (overlapMs / (ownEnd - ownStart)) * 100))
  if (timeOverlap < 25) return null

  const stylesCompatible = input.ownStudyStyle === "either" || input.candidateStudyStyle === "either" || input.ownStudyStyle === input.candidateStudyStyle
  const languagesCompatible = input.ownLanguage === "either" || input.candidateLanguage === "either" || input.ownLanguage === input.candidateLanguage
  const sameVenue = Boolean(input.ownVenueId && input.candidateVenueId && input.ownVenueId === input.candidateVenueId)
  const flexibleVenue = !input.ownVenueId || !input.candidateVenueId
  const venueScore = sameVenue ? 100 : flexibleVenue ? 75 : 35
  const styleScore = stylesCompatible ? 100 : 40
  const languageScore = languagesCompatible ? 100 : 25
  const semesterDifference = Math.abs(input.candidateSemester - input.ownSemester)
  const semesterScore = Math.max(40, 100 - semesterDifference * 10)
  const compatibilityScore = Math.round(
    timeOverlap * 0.45 + venueScore * 0.2 + styleScore * 0.15 + languageScore * 0.1 + semesterScore * 0.1
  )

  return {
    timeOverlap,
    compatibilityScore,
    compatibilityReasons: [
      `${timeOverlap}% time overlap`,
      sameVenue ? "Same study space" : flexibleVenue ? "Flexible study space" : "Different preferred spaces",
      stylesCompatible ? "Compatible study style" : "Different study styles",
      languagesCompatible ? "Compatible language" : "Different languages",
    ],
  }
}
