export interface StudyCalendarEvent {
  id: string
  startsAt: string
  endsAt: string
  subject: string
  partnerName: string
  venueName?: string | null
  locale: "el" | "en"
}

interface CalendarExportOptions {
  generatedAt?: Date
  reminderMinutes?: number
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
}

function utcIcsTimestamp(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new Error("Invalid calendar date")
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

export function foldIcsLine(line: string): string[] {
  const encoder = new TextEncoder()
  const lines: string[] = []
  let chunk = ""
  let chunkBytes = 0
  let limit = 75

  for (const character of line) {
    const characterBytes = encoder.encode(character).length
    if (chunk && chunkBytes + characterBytes > limit) {
      lines.push(lines.length === 0 ? chunk : ` ${chunk}`)
      chunk = ""
      chunkBytes = 0
      limit = 74
    }
    chunk += character
    chunkBytes += characterBytes
  }
  if (chunk || line === "") lines.push(lines.length === 0 ? chunk : ` ${chunk}`)
  return lines
}

export function createStudySessionIcs(
  event: StudyCalendarEvent,
  options: CalendarExportOptions = {},
): string {
  const start = new Date(event.startsAt)
  const end = new Date(event.endsAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error("Invalid study session time")
  }

  const generatedAt = options.generatedAt ?? new Date()
  const reminderMinutes = options.reminderMinutes ?? 30
  if (!Number.isInteger(reminderMinutes) || reminderMinutes < 0) {
    throw new Error("Invalid reminder")
  }

  const subject = event.subject.trim() || (event.locale === "el" ? "Μελέτη" : "Study session")
  const partner = event.partnerName.trim() || (event.locale === "el" ? "Συνεργάτης μελέτης" : "Study partner")
  const summary = event.locale === "el" ? `Μελέτη: ${subject}` : `Study session: ${subject}`
  const description = event.locale === "el"
    ? `Συνάντηση μελέτης με ${partner} μέσω Read Partner.`
    : `Study session with ${partner} through Read Partner.`
  const alarmDescription = event.locale === "el" ? "Η συνάντηση μελέτης ξεκινά σύντομα." : "Your study session starts soon."
  const safeEventId = event.id.replace(/[^a-zA-Z0-9-]/g, "")
  if (!safeEventId) throw new Error("Invalid study session id")

  const rawLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Read Partner//Study Session//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:study-session-${safeEventId}@readpartner.app`,
    `DTSTAMP:${utcIcsTimestamp(generatedAt)}`,
    `DTSTART:${utcIcsTimestamp(start)}`,
    `DTEND:${utcIcsTimestamp(end)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    ...(event.venueName?.trim() ? [`LOCATION:${escapeIcsText(event.venueName.trim())}`] : []),
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    `TRIGGER:-PT${reminderMinutes}M`,
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(alarmDescription)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]

  return `${rawLines.flatMap(foldIcsLine).join("\r\n")}\r\n`
}

export function studySessionCalendarFilename(startsAt: string, subject: string): string {
  const date = new Date(startsAt)
  if (Number.isNaN(date.getTime())) throw new Error("Invalid calendar date")
  const safeSubject = subject
    .normalize("NFKC")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 48) || "study-session"
  return `read-partner-${date.toISOString().slice(0, 10)}-${safeSubject}.ics`
}

export function downloadStudySessionCalendar(event: StudyCalendarEvent): void {
  const calendar = createStudySessionIcs(event)
  const blob = new Blob([calendar], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = studySessionCalendarFilename(event.startsAt, event.subject)
  link.rel = "noopener"
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Keep the URL alive long enough for slower mobile browsers to begin the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
