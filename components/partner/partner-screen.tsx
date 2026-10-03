"use client"

import { useState } from "react"
import { DailyWizard, type MatchPreferences } from "./daily-wizard"
import { PartnerStack } from "./partner-stack"
import { createSession, findMatchCandidates } from "@/lib/actions"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"
import { getMatchingSearchErrorKind } from "@/lib/matching-feedback"
import type { MatchingSearchFeedback, PartnerCandidate, Profile, Subject, Venue } from "@/lib/types"

interface PartnerScreenProps {
  onGoToChat: () => void
  userId: string
  profile: Profile | null
  subjects: Subject[]
  venues: Venue[]
}

export function PartnerScreen({ onGoToChat, profile, subjects, venues }: PartnerScreenProps) {
  const { t, locale } = useTranslation()
  const [wizardComplete, setWizardComplete] = useState(false)
  const [prefs, setPrefs] = useState<MatchPreferences>({ subject: "", venue: "", duration: "", plannedStart: "", studyStyle: "either", language: "either", maxDistanceKm: 5 })
  const [candidates, setCandidates] = useState<PartnerCandidate[]>([])
  const [feedback, setFeedback] = useState<MatchingSearchFeedback>({ activeMatchCount: 0, pendingInterestCount: 0, searchExpiresAt: null })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleWizardComplete = async (p: MatchPreferences) => {
    setIsSearching(true)

    try {
      const subjectId = Number.parseInt(p.subject, 10)
      const venueId = p.venue === "anywhere" ? null : p.venue

      const session = await createSession({
        subjectId,
        venueId,
        duration: p.duration,
        plannedStart: p.plannedStart,
        studyStyle: p.studyStyle,
        language: p.language,
        maxDistanceKm: p.maxDistanceKm,
      })
      const result = await findMatchCandidates(session.id)

      setPrefs(p)
      setSessionId(session.id)
      setCandidates(result.candidates)
      setFeedback(result.feedback)
      setWizardComplete(true)
    } catch (error) {
      const message = typeof error === "object" && error && "message" in error ? String(error.message) : ""
      const errorKind = getMatchingSearchErrorKind(message)
      toast.error(errorKind === "student-account"
        ? (locale === "el" ? "Το matchmaking είναι διαθέσιμο μόνο σε φοιτητικούς λογαριασμούς." : "Matchmaking is available only to student accounts.")
        : errorKind === "expired"
          ? (locale === "el" ? "Η αναζήτηση έληξε. Δημιούργησε μια νέα αναζήτηση." : "That search expired. Start a new search.")
          : t("partner.search.error"))
    } finally {
      setIsSearching(false)
    }
  }

  const handleRestart = () => {
    setWizardComplete(false)
    setPrefs({ subject: "", venue: "", duration: "", plannedStart: "", studyStyle: "either", language: "either", maxDistanceKm: 5 })
    setCandidates([])
    setFeedback({ activeMatchCount: 0, pendingInterestCount: 0, searchExpiresAt: null })
    setSessionId(null)
  }

  if (!wizardComplete) {
    return (
      <DailyWizard initialSemester={profile?.semester}
        onComplete={handleWizardComplete}
        subjects={subjects}
        venues={venues}
        isSubmitting={isSearching}
      />
    )
  }

  return (
    <PartnerStack
      candidates={candidates}
      feedback={feedback}
      matchSubject={prefs.subject}
      onGoToChat={onGoToChat}
      onRestart={handleRestart}
      sessionId={sessionId}
      subjects={subjects}
      currentUserInitials={(profile?.display_name || "ME").slice(0, 2).toUpperCase()}
      currentUserColor={profile?.avatar_color || "bg-primary"}
    />
  )
}
