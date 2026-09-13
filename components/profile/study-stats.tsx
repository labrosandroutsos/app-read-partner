"use client"

import { Clock } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface StudyStatsProps {
  stats?: { subject: string; hours: number }[]
}

function hueFor(text: string) {
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) % 360
  return hash
}

export function StudyStats({ stats }: StudyStatsProps) {
  const { t } = useTranslation()

  const data = stats ?? []
  const maxHours = Math.max(...data.map((s) => s.hours), 1)
  const totalHours = data.reduce((sum, s) => sum + s.hours, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-gradient-to-br from-accent/12 to-transparent p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/18 text-accent-strong">
          <Clock className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-bold leading-none text-foreground">{totalHours}<span className="ml-1 text-sm font-medium text-muted-foreground">{t("profile.stats.hours")}</span></p>
          <p className="mt-1 text-xs text-muted-foreground">{t("profile.stats.total")}</p>
        </div>
      </div>

      {data.map((stat) => {
        const hue = hueFor(stat.subject)
        return (
          <div key={stat.subject} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate font-medium text-foreground">{stat.subject}</span>
              <span className="ml-2 shrink-0 font-semibold" style={{ color: `oklch(0.45 0.12 ${hue})` }}>{stat.hours}h</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(stat.hours / maxHours) * 100}%`, backgroundColor: `oklch(0.6 0.13 ${hue})` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
