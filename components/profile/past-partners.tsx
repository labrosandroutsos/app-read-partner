"use client"

import { useTranslation } from "@/lib/i18n"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/types"

interface PastPartnersProps {
  partners?: { profile: Profile; sessions: number }[]
}

export function PastPartners({ partners }: PastPartnersProps) {
  const { t, locale } = useTranslation()

  const items = (partners ?? []).map(pp => ({
    id: pp.profile.id,
    name: pp.profile.display_name || (locale === "el" ? "Φοιτητής" : "Student"),
    initials: (pp.profile.display_name || "?").slice(0, 2).toUpperCase(),
    avatarColor: pp.profile.avatar_color || "bg-primary",
    sessions: pp.sessions,
  }))
  if (!items.length) return <p className="text-sm leading-6 text-muted-foreground">{locale === "el" ? "Οι συνεργάτες μελέτης σου θα εμφανιστούν εδώ." : "Your study partners will appear here."}</p>

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-3 pb-2">
        {items.map((pp) => (
          <div key={pp.id} className="flex flex-col items-center gap-1.5 min-w-[72px]">
            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm", pp.avatarColor)}>
              {pp.initials}
            </div>
            <span className="text-xs font-medium text-foreground text-center leading-tight">
              {pp.name}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {pp.sessions} {t("profile.partners.sessions")}
            </span>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
