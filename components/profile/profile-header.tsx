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
  const { t } = useTranslation()

  const displayName = profile?.display_name || 'Student'
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const degree = profile?.degree || '—'
  const semester = profile?.semester || 1

  return (
    <div className="flex flex-col items-center gap-3 pt-6 pb-4 px-4 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 h-8 w-8"
        onClick={onOpenSettings}
        aria-label={t("profile.settings")}
      >
        <Settings className="h-4 w-4" />
      </Button>

      <div className={cn("w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg bg-primary")}>
        {initials}
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-foreground">{displayName}</h2>
        <p className="text-sm text-muted-foreground">
          {degree} &middot; {t("partner.card.semester")} {semester}
        </p>
      </div>
    </div>
  )
}
