"use client"

import { type ReactNode, useEffect, useMemo, useState, useTransition } from "react"
import { CalendarClock, Check, Loader2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cancelStudySession, proposeStudySession, respondToStudySession } from "@/lib/actions"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { StudySessionRecord, Venue } from "@/lib/types"

interface ScheduleSessionDialogProps {
  matchId: string
  currentUserId: string
  partnerName: string
  venues: Venue[]
  schedule: StudySessionRecord | null
  trigger?: ReactNode
}

function localParts(iso?: string | null) {
  const date = iso ? new Date(iso) : new Date(Date.now() + 24 * 60 * 60 * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(iso ? date.getHours() : 18).padStart(2, "0")
  const minutes = String(iso ? date.getMinutes() : 0).padStart(2, "0")
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` }
}

export function ScheduleSessionDialog({ matchId, currentUserId, partnerName, venues, schedule, trigger }: ScheduleSessionDialogProps) {
  const { locale } = useTranslation()
  const el = locale === "el"
  const router = useRouter()
  const defaults = useMemo(() => localParts(schedule?.starts_at), [schedule?.starts_at])
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(defaults.date)
  const [time, setTime] = useState(defaults.time)
  const [duration, setDuration] = useState(String(schedule?.duration_hours || 2))
  const [venueId, setVenueId] = useState(schedule?.venue_id ?? "anywhere")
  const [isPending, startTransition] = useTransition()
  const incomingProposal = schedule?.status === "proposed" && schedule.proposed_by !== currentUserId

  useEffect(() => {
    const nextDefaults = localParts(schedule?.starts_at)
    setDate(nextDefaults.date)
    setTime(nextDefaults.time)
    setDuration(String(schedule?.duration_hours || 2))
    setVenueId(schedule?.venue_id ?? "anywhere")
  }, [schedule?.duration_hours, schedule?.starts_at, schedule?.updated_at, schedule?.venue_id])

  const propose = () => {
    if (isPending) return
    const startsAt = new Date(`${date}T${time}:00`)
    const endsAt = new Date(startsAt.getTime() + Number(duration) * 60 * 60 * 1000)
    startTransition(async () => {
      try {
        await proposeStudySession({ matchId, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), venueId: venueId === "anywhere" ? null : venueId })
        setOpen(false)
        router.refresh()
        toast.success(el ? "Η πρόταση στάλθηκε." : "Schedule proposal sent.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (el ? "Η πρόταση απέτυχε." : "Proposal failed."))
      }
    })
  }

  const respond = (accept: boolean) => {
    if (!schedule || isPending) return
    startTransition(async () => {
      try {
        await respondToStudySession(schedule.id, accept)
        setOpen(false)
        router.refresh()
        toast.success(accept ? (el ? "Η συνάντηση επιβεβαιώθηκε." : "Session confirmed.") : (el ? "Η πρόταση απορρίφθηκε." : "Proposal declined."))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (el ? "Η ενέργεια απέτυχε." : "Action failed."))
      }
    })
  }

  const cancel = () => {
    if (!schedule || isPending) return
    startTransition(async () => {
      try {
        await cancelStudySession(schedule.id)
        setOpen(false)
        router.refresh()
        toast.success(el ? "Η συνάντηση ακυρώθηκε." : "Session cancelled.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (el ? "Η ακύρωση απέτυχε." : "Cancellation failed."))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={el ? "Προγραμματισμός συνάντησης" : "Schedule study session"}><CalendarClock className="h-4 w-4" /></Button>}
      </DialogTrigger>
      <DialogContent className="max-w-[390px]">
        <DialogHeader>
          <DialogTitle>{el ? `Μελέτη με ${partnerName}` : `Study with ${partnerName}`}</DialogTitle>
          <DialogDescription>{incomingProposal ? (el ? "Ο συνεργάτης σου πρότεινε αυτή τη συνάντηση." : "Your partner proposed this session.") : (el ? "Πρότεινε ή άλλαξε την ώρα και τον χώρο." : "Propose or change the time and place.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor={`schedule-date-${matchId}`}>{el ? "Ημερομηνία" : "Date"}</Label><Input id={`schedule-date-${matchId}`} type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor={`schedule-time-${matchId}`}>{el ? "Ώρα" : "Time"}</Label><Input id={`schedule-time-${matchId}`} type="time" value={time} onChange={(event) => setTime(event.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>{el ? "Διάρκεια" : "Duration"}</Label><Select value={duration} onValueChange={setDuration}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1h</SelectItem><SelectItem value="2">2h</SelectItem><SelectItem value="4">4h</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>{el ? "Χώρος" : "Venue"}</Label><Select value={venueId} onValueChange={setVenueId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="anywhere">{el ? "Θα αποφασίσουμε" : "Decide later"}</SelectItem>{venues.filter((venue) => venue.is_open).map((venue) => <SelectItem key={venue.id} value={venue.id}>{venue.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {incomingProposal ? (
            <><Button variant="outline" onClick={() => respond(false)} disabled={isPending}><X className="h-4 w-4" />{el ? "Απόρριψη" : "Decline"}</Button><Button onClick={() => respond(true)} disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{el ? "Αποδοχή" : "Accept"}</Button></>
          ) : (
            <>{schedule && <Button variant="outline" className="text-destructive" onClick={cancel} disabled={isPending}>{el ? "Ακύρωση συνάντησης" : "Cancel session"}</Button>}<Button onClick={propose} disabled={isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin" />}{schedule ? (el ? "Πρόταση αλλαγής" : "Propose change") : (el ? "Αποστολή πρότασης" : "Send proposal")}</Button></>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
