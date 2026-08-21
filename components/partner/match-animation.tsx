"use client"

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

export function MatchAnimation({ partner, currentUserInitials, currentUserColor, onGoToChat, onContinue }: MatchAnimationProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-6 p-8 animate-in zoom-in-75 duration-500">
        {/* Avatars */}
        <div className="flex items-center -space-x-4">
          <div className={cn("w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg ring-4 ring-background z-10", currentUserColor)}>
            {currentUserInitials}
          </div>
          <div className={cn("w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg ring-4 ring-background", partner.avatarColor)}>
            {partner.initials}
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl font-black text-primary animate-in slide-in-from-bottom-4 duration-700">
            {t("partner.match")}
          </h2>
          <p className="text-muted-foreground mt-2">{t("partner.match.subtitle")}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full max-w-[240px]">
          <Button onClick={onGoToChat} className="w-full" size="lg">
            {t("partner.match.chat")}
          </Button>
          <Button onClick={onContinue} variant="outline" className="w-full">
            {t("partner.match.continue")}
          </Button>
        </div>
      </div>
    </div>
  )
}
