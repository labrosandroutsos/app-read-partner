"use client"

import { useState } from "react"
import { DailyWizard } from "./daily-wizard"
import { PartnerStack } from "./partner-stack"
import { createSession, findMatchCandidates } from "@/lib/actions"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"
import type { PartnerCandidate, Profile, Subject, Venue } from "@/lib/types"

interface PartnerScreenProps {
  onGoToChat: () => void
  userId: string
  profile: Profile | null
  subjects: Subject[]
  venues: Venue[]
}

export function PartnerScreen({ onGoToChat, profile, subjects, venues }: PartnerScreenProps) {
  const { t } = useTranslation()
  const [wizardComplete, setWizardComplete] = useState(false)
  const [prefs, setPrefs] = useState({ subject: "", venue: "", duration: "" })
  const [candidates, setCandidates] = useState<PartnerCandidate[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleWizardComplete = async (p: { subject: string; venue: string; duration: string }) => {
    setIsSearching(true)

    try {
      const subjectId = Number.parseInt(p.subject, 10)
      const venueId = p.venue === "anywhere" ? null : p.venue

      const session = await createSession({
        subjectId,
        venueId,
        duration: p.duration,
      })
      const nextCandidates = await findMatchCandidates(session.id)

      setPrefs(p)
      setSessionId(session.id)
      setCandidates(nextCandidates)
      setWizardComplete(true)
    } catch {
      toast.error(t("partner.search.error"))
    } finally {
      setIsSearching(false)
    }
  }

  const handleRestart = () => {
    setWizardComplete(false)
    setPrefs({ subject: "", venue: "", duration: "" })
    setCandidates([])
    setSessionId(null)
  }

  if (!wizardComplete) {
    return (
      <DailyWizard
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
