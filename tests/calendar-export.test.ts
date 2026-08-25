import { describe, expect, it } from "vitest"
import { createStudySessionIcs, foldIcsLine, studySessionCalendarFilename } from "../lib/calendar-export"

describe("calendar export", () => {
  it("creates a portable confirmed event with details and a reminder", () => {
    const calendar = createStudySessionIcs({
      id: "00000000-0000-4000-8000-000000000001",
      startsAt: "2026-08-25T15:00:00.000Z",
      endsAt: "2026-08-25T17:00:00.000Z",
      subject: "Algorithms, Part 1",
      partnerName: "Alex; P.",
      venueName: "University Library, Floor 2",
      locale: "en",
    }, { generatedAt: new Date("2026-08-25T12:00:00.000Z") })

    expect(calendar).toContain("VERSION:2.0\r\n")
    expect(calendar).toContain("DTSTAMP:20260825T120000Z\r\n")
    expect(calendar).toContain("DTSTART:20260825T150000Z\r\n")
    expect(calendar).toContain("DTEND:20260825T170000Z\r\n")
    expect(calendar).toContain("SUMMARY:Study session: Algorithms\\, Part 1\r\n")
    expect(calendar).toContain("DESCRIPTION:Study session with Alex\\; P. through Read Partner.\r\n")
    expect(calendar).toContain("LOCATION:University Library\\, Floor 2\r\n")
    expect(calendar).toContain("BEGIN:VALARM\r\nTRIGGER:-PT30M\r\nACTION:DISPLAY")
    expect(calendar.endsWith("END:VCALENDAR\r\n")).toBe(true)
  })

  it("rejects invalid session times and identifiers", () => {
    const event = {
      id: "session-1",
      startsAt: "2026-08-25T17:00:00.000Z",
      endsAt: "2026-08-25T15:00:00.000Z",
      subject: "Statistics",
      partnerName: "Alex",
      locale: "en" as const,
    }
    expect(() => createStudySessionIcs(event)).toThrow("Invalid study session time")
    expect(() => createStudySessionIcs({ ...event, id: "!!!", endsAt: "2026-08-25T18:00:00.000Z" })).toThrow("Invalid study session id")
  })

  it("folds UTF-8 content to the RFC line-length limit", () => {
    const folded = foldIcsLine(`DESCRIPTION:${"Μελέτη ".repeat(24)}`)
    const encoder = new TextEncoder()
    expect(folded.length).toBeGreaterThan(1)
    expect(folded.slice(1).every((line) => line.startsWith(" "))).toBe(true)
    expect(folded.every((line) => encoder.encode(line).length <= 75)).toBe(true)
  })

  it("creates a safe and recognizable filename", () => {
    expect(studySessionCalendarFilename("2026-08-25T15:00:00.000Z", "Γραμμική Άλγεβρα")).toBe("read-partner-2026-08-25-γραμμική-άλγεβρα.ics")
  })
})
