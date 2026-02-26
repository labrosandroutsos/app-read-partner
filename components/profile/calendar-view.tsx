"use client"

import { useState } from "react"
import { Clock, MapPin, CalendarDays } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { StudySessionRecord } from "@/lib/types"

interface CalendarViewProps {
  studySessions?: StudySessionRecord[]
}

export function CalendarView({ studySessions }: CalendarViewProps) {
  const { t } = useTranslation()
  const [date, setDate] = useState<Date | undefined>(new Date())

  const items = (studySessions ?? []).map(s => ({
    id: s.id,
    date: s.date,
    subject: (s as any).subject?.name || 'Subject',
    partnerName: (s as any).partner?.display_name?.split(' ')[0] || '?',
    partnerInitials: ((s as any).partner?.display_name || '?').slice(0, 2).toUpperCase(),
    partnerColor: (s as any).partner?.avatar_color || 'bg-primary',
    venue: (s as any).venue?.name || 'Venue',
    duration: s.duration_hours,
  }))

  const sessionDates = items.map(s => new Date(s.date))
  const modifiers = { hasSession: sessionDates }
  const modifiersStyles = { hasSession: { fontWeight: 700 } }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="rounded-md border"
        />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">{t("profile.calendar.upcoming")}</h4>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No study sessions scheduled yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", session.partnerColor)}>
                    {session.partnerInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{session.subject}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {session.duration}h
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {session.venue}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {new Date(session.date).toLocaleDateString("el-GR", { day: "numeric", month: "short" })}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
