"use client"

import { useMemo, useState, useTransition } from "react"
import { Check, Clock, Loader2, MapPin, X } from "lucide-react"
import { el as greekCalendar, enGB } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cancelStudySession, respondToStudySession } from "@/lib/actions"
import { useTranslation } from "@/lib/i18n"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AddToCalendarButton } from "@/components/calendar/add-to-calendar-button"
import { cn } from "@/lib/utils"
import type { StudySessionRecord } from "@/lib/types"

interface CalendarViewProps {
  studySessions?: StudySessionRecord[]
  userId: string
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function CalendarView({ studySessions = [], userId }: CalendarViewProps) {
  const { t, locale } = useTranslation()
  const el = locale === "el"
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const items = useMemo(() => studySessions.filter((session) => session.status !== 'cancelled').map((session) => {
    const partner = session.user_id === userId
      ? session.partner
      : session.owner
    const startsAt = session.starts_at ? new Date(session.starts_at) : new Date(`${session.date}T12:00:00`)
    return {
      id: session.id,
      startsAt,
      endsAt: session.ends_at,
      subject: (el ? session.subject?.name : session.subject?.name_en) || (el ? 'Μάθημα' : 'Subject'),
      partnerName: partner?.display_name?.split(' ')[0] || '?',
      partnerInitials: (partner?.display_name || '?').slice(0, 2).toUpperCase(),
      partnerColor: partner?.avatar_color || 'bg-primary',
      venue: session.venue?.name || (el ? 'Δεν ορίστηκε' : 'Not selected'),
      duration: session.duration_hours,
      status: session.status,
      proposedBy: session.proposed_by,
      real: true,
    }
  }), [el, studySessions, userId])

  const visibleItems = date ? items.filter((session) => sameDay(session.startsAt, date)) : items
  const respond = (sessionId: string, accept: boolean) => {
    setPendingId(sessionId)
    startTransition(async () => {
      try {
        await respondToStudySession(sessionId, accept)
        router.refresh()
        toast.success(accept ? (el ? "Η συνάντηση επιβεβαιώθηκε." : "Session confirmed.") : (el ? "Η πρόταση απορρίφθηκε." : "Proposal declined."))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (el ? "Η ενέργεια απέτυχε." : "Action failed."))
      } finally { setPendingId(null) }
    })
  }
  const cancel = (sessionId: string) => {
    setPendingId(sessionId)
    startTransition(async () => {
      try {
        await cancelStudySession(sessionId)
        router.refresh()
        toast.success(el ? "Η συνάντηση ακυρώθηκε." : "Session cancelled.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (el ? "Η ακύρωση απέτυχε." : "Cancellation failed."))
      } finally { setPendingId(null) }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center"><Calendar locale={el ? greekCalendar : enGB} mode="single" selected={date} onSelect={setDate} modifiers={{ hasSession: items.map((session) => session.startsAt) }} modifiersStyles={{ hasSession: { fontWeight: 700, textDecoration: 'underline' } }} className="rounded-xl border bg-card [--cell-size:2.5rem]" /></div>
      <div>
        <h4 className="mb-2 text-sm font-semibold text-foreground">{date ? date.toLocaleDateString(locale === 'el' ? 'el-GR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : t("profile.calendar.upcoming")}</h4>
        <div className="flex flex-col gap-2">
          {visibleItems.length === 0 && <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">{el ? "Δεν υπάρχουν συναντήσεις για αυτή την ημέρα." : "No sessions on this day."}</p>}
          {visibleItems.map((session) => {
            const incoming = session.real && session.status === 'proposed' && session.proposedBy !== userId
            const statusLabel = session.status === 'confirmed'
              ? (el ? 'Επιβεβαιωμένη' : 'Confirmed')
              : session.status === 'completed'
                ? (el ? 'Ολοκληρωμένη' : 'Completed')
                : (el ? 'Πρόταση' : 'Proposed')

            return (
              <Card key={session.id}>
                <CardContent className="space-y-3 p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", session.partnerColor)}>{session.partnerInitials}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{session.subject}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{session.startsAt.toLocaleTimeString(locale === 'el' ? 'el-GR' : 'en-GB', { hour: '2-digit', minute: '2-digit' })} · {session.duration}h</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{session.venue}</span>
                      </div>
                    </div>
                    <Badge variant={session.status === 'confirmed' ? 'default' : 'outline'}>{statusLabel}</Badge>
                  </div>

                  {session.real && session.status !== 'completed' && (
                    <div className="flex flex-wrap justify-end gap-2 border-t pt-2">
                      {incoming ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => respond(session.id, false)} disabled={isPending}><X className="h-3.5 w-3.5" />{el ? 'Απόρριψη' : 'Decline'}</Button>
                          <Button size="sm" onClick={() => respond(session.id, true)} disabled={isPending}>{pendingId === session.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}{el ? 'Αποδοχή' : 'Accept'}</Button>
                        </>
                      ) : (
                        <>
                          {session.status === 'confirmed' && session.endsAt && (
                            <AddToCalendarButton
                              sessionId={session.id}
                              startsAt={session.startsAt.toISOString()}
                              endsAt={session.endsAt}
                              subjectName={session.subject}
                              partnerName={session.partnerName}
                              venueName={session.venue}
                            />
                          )}
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => cancel(session.id)} disabled={isPending}>
                            {pendingId === session.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {el ? 'Ακύρωση' : 'Cancel'}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
