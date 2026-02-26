"use client"

import { useState } from "react"
import { Users } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { DailyWizard } from "./daily-wizard"
import { PartnerStack } from "./partner-stack"
import { createSession } from "@/lib/actions"
import { createClient } from "@/lib/supabase/client"
import type { Profile, Subject, Venue, PartnerCardData } from "@/lib/types"

interface PartnerScreenProps {
  onGoToChat: () => void
  userId: string
  profile: Profile | null
  subjects: Subject[]
  venues: Venue[]
}

export function PartnerScreen({ onGoToChat, userId, profile, subjects, venues }: PartnerScreenProps) {
  const { t } = useTranslation()
  const [wizardComplete, setWizardComplete] = useState(false)
  const [prefs, setPrefs] = useState({ subject: "", venue: "", duration: "" })
  const [candidates, setCandidates] = useState<PartnerCardData[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)

  const handleWizardComplete = async (p: { subject: string; venue: string; duration: string }) => {
    setPrefs(p)

    try {
      const subjectId = parseInt(p.subject) || 1
      const venueId = p.venue === "anywhere" ? null : p.venue

      const session = await createSession({
        subjectId,
        venueId,
        duration: p.duration,
      })
      setSessionId(session?.id ?? null)

      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*, profiles:user_id(*), subjects:subject_id(*)')
        .eq('planned_date', today)
        .neq('user_id', userId)

      if (sessions && sessions.length > 0) {
        const mapped: PartnerCardData[] = sessions.map((s: any) => ({
          id: s.profiles?.id ?? s.user_id,
          name: s.profiles?.display_name || 'Student',
          initials: (s.profiles?.display_name || 'S').slice(0, 2).toUpperCase(),
          degree: s.profiles?.degree || '',
          semester: s.profiles?.semester || 1,
          subjects: [p.subject],
          avatarColor: s.profiles?.avatar_color || 'bg-blue-500',
          distance: Math.round(Math.random() * 30 + 1) / 10,
          timeOverlap: Math.round(50 + Math.random() * 50),
          _sessionId: s.id,
          _subjectId: s.subject_id,
        }))
        setCandidates(mapped)
      }
    } catch {
      // Session creation or candidate fetch failed — proceed with empty candidates
    }

    setWizardComplete(true)
  }

  const handleRestart = () => {
    setWizardComplete(false)
    setPrefs({ subject: "", venue: "", duration: "" })
    setCandidates([])
    setSessionId(null)
  }

  if (!wizardComplete) {
    return <DailyWizard onComplete={handleWizardComplete} subjects={subjects} venues={venues} />
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Users className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{t("partner.nomore")}</h3>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          {t("partner.nomore.subtitle")}
        </p>
        <button
          onClick={handleRestart}
          className="mt-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          {t("partner.restart")}
        </button>
      </div>
    )
  }

  return (
    <PartnerStack
      students={candidates}
      matchSubject={prefs.subject}
      onGoToChat={onGoToChat}
      onRestart={handleRestart}
      userId={userId}
      profile={profile}
      sessionId={sessionId}
      subjects={subjects}
    />
  )
}
