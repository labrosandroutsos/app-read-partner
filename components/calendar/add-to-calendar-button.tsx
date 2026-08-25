"use client"

import { CalendarPlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { downloadStudySessionCalendar } from "@/lib/calendar-export"
import { useTranslation } from "@/lib/i18n"

interface AddToCalendarButtonProps {
  sessionId: string
  startsAt: string
  endsAt: string
  subjectName: string
  partnerName: string
  venueName?: string | null
  className?: string
}

export function AddToCalendarButton({
  sessionId,
  startsAt,
  endsAt,
  subjectName,
  partnerName,
  venueName,
  className,
}: AddToCalendarButtonProps) {
  const { locale } = useTranslation()
  const el = locale === "el"

  const download = () => {
    try {
      downloadStudySessionCalendar({
        id: sessionId,
        startsAt,
        endsAt,
        subject: subjectName,
        partnerName,
        venueName,
        locale,
      })
      toast.success(el ? "Το αρχείο ημερολογίου δημιουργήθηκε." : "Calendar file created.")
    } catch {
      toast.error(el ? "Δεν ήταν δυνατή η δημιουργία του ημερολογίου." : "The calendar file could not be created.")
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" className={className} onClick={download}>
      <CalendarPlus className="h-3.5 w-3.5" />
      {el ? "Στο ημερολόγιο" : "Add to calendar"}
    </Button>
  )
}
