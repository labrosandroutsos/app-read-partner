"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PartnerCandidate } from "@/lib/types"

interface MatchAnimationProps {
  partner: PartnerCandidate
  currentUserInitials: string
  currentUserColor: string
  onGoToChat: () => void
  onContinue: () => void
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener?.("change", on)
    return () => mq.removeEventListener?.("change", on)
  }, [])
  return reduced
}

const SPARKLES = Array.from({ length: 16 }, (_, i) => ({
  left: `${8 + (i * 84) / 16 + (i % 3) * 3}%`,
  delay: `${(i % 6) * 55}ms`,
  size: 6 + (i % 4) * 3,
  amber: i % 2 === 0,
}))

export function MatchAnimation({ partner, currentUserInitials, currentUserColor, onGoToChat, onContinue }: MatchAnimationProps) {
  const { t, locale } = useTranslation()
  const el = locale === "el"
  const reduced = useReducedMotion()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background/70 px-6 backdrop-blur-xl duration-300 animate-in fade-in">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/10 via-transparent to-primary/5" />

      {!reduced && (
        <div className="pointer-events-none absolute inset-x-0 top-[38%] h-0">
          {SPARKLES.map((s, i) => (
            <span
              key={i}
              className={cn("sparkle absolute rounded-full", s.amber ? "bg-accent" : "bg-primary")}
              style={{ left: s.left, width: s.size, height: s.size, animationDelay: s.delay }}
            />
          ))}
        </div>
      )}

      <div className="relative flex w-full max-w-xs flex-col items-center gap-6 p-4 duration-500 animate-in zoom-in-95">
        <div className="flex items-center -space-x-4">
          <div className={cn("flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold text-white shadow-lg ring-4 ring-background", currentUserColor)}>
            {currentUserInitials}
          </div>
          <div className="z-10 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md ring-4 ring-background">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className={cn("flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold text-white shadow-lg ring-4 ring-background", partner.avatarColor)}>
            {partner.initials}
          </div>
        </div>

        <div className="text-center">
          <h2 className="study-title text-3xl text-primary">{el ? "Ταιριάξατε!" : "You matched!"}</h2>
          <p className="mt-1.5 text-[15px] leading-6 text-muted-foreground">
            {el
              ? `Εσύ και ο/η ${partner.name} μπορείτε πλέον να κανονίσετε διάβασμα.`
              : `You and ${partner.name} can plan your first study session.`}
          </p>
        </div>

        <div className="w-full rounded-2xl border border-dashed bg-card/60 px-4 py-3 text-center text-sm text-muted-foreground">
          {el ? "Δοκίμασε: «Γεια! Θέλεις να διαβάσουμε μαζί αυτή τη βδομάδα;»" : "Try: “Hey! Want to study together this week?”"}
        </div>

        <div className="flex w-full flex-col gap-2.5">
          <Button onClick={onGoToChat} className="w-full" size="lg">
            {el ? "Πες ένα γεια" : "Say hi"}
          </Button>
          <Button onClick={onContinue} variant="ghost" className="w-full">
            {t("partner.match.continue")}
          </Button>
        </div>
      </div>
    </div>
  )
}
