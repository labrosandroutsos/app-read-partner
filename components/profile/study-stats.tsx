"use client"

import { useTranslation } from "@/lib/i18n"
import { Progress } from "@/components/ui/progress"

interface StudyStatsProps {
  stats?: { subject: string; hours: number }[]
}

export function StudyStats({ stats }: StudyStatsProps) {
  const { t } = useTranslation()

  const data = stats ?? []
  const maxHours = Math.max(...data.map((s) => s.hours), 1)
  const totalHours = data.reduce((sum, s) => sum + s.hours, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{t("profile.stats.total")}</span>
        <span className="text-lg font-bold text-foreground">{totalHours} {t("profile.stats.hours")}</span>
      </div>
      {data.map((stat) => (
        <div key={stat.subject} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium truncate">{stat.subject}</span>
            <span className="text-muted-foreground shrink-0 ml-2">{stat.hours}h</span>
          </div>
          <Progress value={(stat.hours / maxHours) * 100} className="h-2.5" />
        </div>
      ))}
    </div>
  )
}
