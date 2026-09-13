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
    <div className="px-5 pb-5">
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
        <div className="h-20 bg-gradient-to-br from-primary/20 via-accent/12 to-transparent" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-10 w-10"
          onClick={onOpenSettings}
          aria-label={t("profile.settings")}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <div className="flex items-end gap-3 px-4 pb-4 -mt-9">
          <div className={cn("flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full text-xl font-semibold text-primary-foreground shadow-md ring-4 ring-card bg-primary")}>
            {initials}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <h2 className="truncate text-lg font-semibold text-foreground">{displayName}</h2>
            <p className="truncate text-sm text-muted-foreground">
              {degree}{degree && semester ? " · " : ""}{semester ? `${t("partner.card.semester")} ${semester}` : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
