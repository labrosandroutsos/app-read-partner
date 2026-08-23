"use client"

import { MapPin, Clock } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { getSubjectById } from "@/lib/mock-data"
import type { PartnerCandidate, Subject as DBSubject } from "@/lib/types"
import { UserSafetyMenu } from "@/components/safety/user-safety-menu"

interface PartnerCardProps {
  candidate: PartnerCandidate
  matchSubject: string
  style?: React.CSSProperties
  className?: string
  subjects?: DBSubject[]
  onBlocked?: () => void
}

export function PartnerCard({ candidate, matchSubject, style, className, subjects, onBlocked }: PartnerCardProps) {
  const { t, locale } = useTranslation()

  // Try DB subjects first, fallback to mock
  const dbSubject = subjects?.find(s => s.id.toString() === matchSubject)
  const mockSubject = getSubjectById(matchSubject)

  const subjectName = dbSubject
    ? (locale === "el" ? dbSubject.name : dbSubject.name_en)
    : mockSubject
    ? (locale === "el" ? mockSubject.name : mockSubject.nameEn)
    : matchSubject

  return (
    <div
      className={cn(
        "absolute inset-0 rounded-2xl bg-card border border-border shadow-lg overflow-hidden select-none touch-none",
        className
      )}
      style={style}
    >
      <div className="absolute right-3 top-3 z-30" onPointerDown={(event) => event.stopPropagation()}>
        <UserSafetyMenu targetUserId={candidate.id} targetName={candidate.name} onBlocked={onBlocked} />
      </div>
      <div className="h-[45%] bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex flex-col items-center justify-center gap-3 p-6">
        <div className={cn("w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-card shadow-md", candidate.avatarColor)}>
          <span className="text-white">{candidate.initials}</span>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground">{candidate.name}</h3>
          <p className="text-sm text-muted-foreground">
            {candidate.degree} &middot; {t("partner.card.semester")} {candidate.semester}
          </p>
        </div>
      </div>

      <div className="h-[55%] p-5 flex flex-col gap-4">
        <Badge className="self-start bg-primary/10 text-primary border-0 text-sm py-1 px-3">
          {subjectName}
        </Badge>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{candidate.distance} {t("partner.card.km")}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{t("partner.card.overlap")}</span>
            </div>
            <span className="font-semibold text-foreground">{candidate.timeOverlap}%</span>
          </div>
          <Progress value={candidate.timeOverlap} className="h-2" />
        </div>

        <div className="flex flex-wrap gap-1.5 mt-auto">
          {candidate.subjects
            .filter((s) => s !== matchSubject)
            .slice(0, 3)
            .map((subId) => {
              const dbSub = subjects?.find(s => s.id.toString() === subId)
              const mockSub = getSubjectById(subId)
              const name = dbSub
                ? (locale === "el" ? dbSub.name : dbSub.name_en)
                : mockSub
                ? (locale === "el" ? mockSub.name : mockSub.nameEn)
                : subId
              return (
                <Badge key={subId} variant="outline" className="text-xs">
                  {name}
                </Badge>
              )
            })}
        </div>
      </div>
    </div>
  )
}
