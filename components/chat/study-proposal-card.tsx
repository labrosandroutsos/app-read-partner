"use client"

import { useTransition } from "react"
import { CalendarClock, Check, Clock3, Loader2, MapPin, Pencil, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cancelStudySession, respondToStudySession } from "@/lib/actions"
import { ScheduleSessionDialog } from "@/components/calendar/schedule-session-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n"
import type { StudySessionRecord, Venue } from "@/lib/types"

interface StudyProposalCardProps {
  matchId: string
  currentUserId: string
  partnerName: string
  venues: Venue[]
  schedule: StudySessionRecord
}

export function StudyProposalCard({ matchId, currentUserId, partnerName, venues, schedule }: StudyProposalCardProps) {
  const { locale } = useTranslation()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const el = locale === "el"
  const incoming = schedule.status === "proposed" && schedule.proposed_by !== currentUserId
  const venueName = venues.find((venue) => venue.id === schedule.venue_id)?.name
  const startsAt = schedule.starts_at ? new Date(schedule.starts_at) : null

  const respond = (accept: boolean) => {
    startTransition(async () => {
      try {
        await respondToStudySession(schedule.id, accept)
        router.refresh()
        toast.success(accept ? (el ? "Η συνάντηση επιβεβαιώθηκε." : "Session confirmed.") : (el ? "Η πρόταση απορρίφθηκε." : "Proposal declined."))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (el ? "Η ενέργεια απέτυχε." : "Action failed."))
      }
    })
  }

  const cancel = () => {
    startTransition(async () => {
      try {
        await cancelStudySession(schedule.id)
        router.refresh()
        toast.success(el ? "Η συνάντηση ακυρώθηκε." : "Session cancelled.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (el ? "Η ακύρωση απέτυχε." : "Cancellation failed."))
      }
    })
  }

  return (
    <Card className="mx-3 mt-3 border-primary/30 bg-primary/5">
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0"><CalendarClock className="h-4 w-4" /></div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{schedule.status === "confirmed" ? (el ? "Επιβεβαιωμένη μελέτη" : "Confirmed study session") : (el ? "Πρόταση μελέτης" : "Study proposal")}</p>
              <p className="text-xs text-muted-foreground truncate">{incoming ? (el ? `${partnerName} πρότεινε συνάντηση` : `${partnerName} suggested a session`) : (el ? "Η πρότασή σου" : "Your proposal")}</p>
            </div>
          </div>
          <Badge variant={schedule.status === "confirmed" ? "default" : "secondary"}>{schedule.status === "confirmed" ? (el ? "Επιβεβαιωμένη" : "Confirmed") : (el ? "Αναμονή" : "Pending")}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /><span>{startsAt ? startsAt.toLocaleString(el ? "el-GR" : "en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</span></div>
          <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /><span className="truncate">{venueName ?? (el ? "Θα αποφασιστεί" : "Decide later")}</span></div>
        </div>

        <div className="flex flex-wrap gap-2">
          {incoming ? (
            <>
              <Button size="sm" variant="outline" onClick={() => respond(false)} disabled={isPending}><X className="h-3.5 w-3.5" />{el ? "Απόρριψη" : "Decline"}</Button>
              <Button size="sm" onClick={() => respond(true)} disabled={isPending}>{isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}{el ? "Αποδοχή" : "Accept"}</Button>
            </>
          ) : (
            <>
              <ScheduleSessionDialog matchId={matchId} currentUserId={currentUserId} partnerName={partnerName} venues={venues} schedule={schedule} trigger={<Button size="sm" variant="outline"><Pencil className="h-3.5 w-3.5" />{el ? "Αλλαγή" : "Change"}</Button>} />
              {schedule.status === "confirmed" && <Button size="sm" variant="ghost" className="text-destructive" onClick={cancel} disabled={isPending}>{el ? "Ακύρωση" : "Cancel"}</Button>}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
