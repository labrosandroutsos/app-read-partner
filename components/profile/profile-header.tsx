"use client"

import { Settings } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/types"

interface ProfileHeaderProps {
  profile?: Profile | null
  onOpenSettings: () => void
}

export function ProfileHeader({ profile, onOpenSettings }: ProfileHeaderProps) {
  const { t, locale } = useTranslation()

  const displayName = profile?.display_name || (locale === "el" ? "Το προφίλ σου" : "Your profile")
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const degree = profile?.degree
  const semester = profile?.semester

  return (
    <div className="flex items-center gap-4 px-5 pb-6 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-0 right-5 h-11 w-11"
        onClick={onOpenSettings}
        aria-label={t("profile.settings")}
      >
        <Settings className="h-4 w-4" />
      </Button>

      <div className={cn("w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-lg font-semibold text-primary-foreground bg-primary")}>
        {initials}
      </div>
      <div className="min-w-0 flex-1 pr-10">
        <h2 className="text-base font-semibold text-foreground">{displayName}</h2>
        <p className="text-sm text-muted-foreground">
          {degree}{degree && semester ? " · " : ""}{semester ? `${t("partner.card.semester")} ${semester}` : ""}
        </p>
      </div>
    </div>
  )
}
