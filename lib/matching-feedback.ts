export type MatchingEmptyStateKind = "waiting" | "existing-match" | "reviewed-all" | "no-candidates"
export type MatchingSearchErrorKind = "student-account" | "expired" | "generic"

interface MatchingEmptyStateInput {
  initialCandidateCount: number
  activeMatchCount: number
  pendingInterestCount: number
  sentInterestCount: number
}

export function getMatchingEmptyStateKind(input: MatchingEmptyStateInput): MatchingEmptyStateKind {
  if (input.pendingInterestCount + input.sentInterestCount > 0) return "waiting"
  if (input.initialCandidateCount === 0 && input.activeMatchCount > 0) return "existing-match"
  if (input.initialCandidateCount > 0) return "reviewed-all"
  return "no-candidates"
}

export function getMatchingSearchErrorKind(message: string): MatchingSearchErrorKind {
  const normalized = message.toLowerCase()
  if (normalized.includes("student account required")) return "student-account"
  if (normalized.includes("search session not found") || normalized.includes("expired")) return "expired"
  return "generic"
}

export function localizeCompatibilityReason(reason: string, locale: "el" | "en"): string {
  if (locale === "en") return reason
  const timeOverlap = reason.match(/^(\d+)% time overlap$/)
  if (timeOverlap) return `${timeOverlap[1]}% χρονική επικάλυψη`

  const translations: Record<string, string> = {
    "Same study space": "Ίδιος χώρος μελέτης",
    "Flexible study space": "Ευέλικτος χώρος μελέτης",
    "Different preferred spaces": "Διαφορετικοί προτιμώμενοι χώροι",
    "Compatible study style": "Συμβατό στυλ μελέτης",
    "Different study styles": "Διαφορετικά στυλ μελέτης",
    "Compatible language": "Συμβατή γλώσσα",
    "Different languages": "Διαφορετικές γλώσσες",
  }
  return translations[reason] ?? reason
}
