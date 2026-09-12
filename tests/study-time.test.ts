import { describe, expect, it } from "vitest"
import { isFutureStudyTime, nextStudyStart } from "../lib/study-time"

describe("study time defaults and validation", () => {
  it("rolls a late-night default into tomorrow", () => {
    const next = nextStudyStart(new Date(2026, 8, 12, 23, 50))
    expect(next.getDate()).toBe(13)
    expect(next.getHours()).toBe(0)
    expect(next.getMinutes()).toBe(30)
  })
  it("leaves at least 30 minutes when already on a slot boundary", () => {
    const now = new Date(2026, 8, 12, 18, 0)
    expect(nextStudyStart(now).getTime() - now.getTime()).toBe(30 * 60_000)
  })
  it("rejects past, missing, and out-of-window selections", () => {
    const now = new Date(2026, 8, 12, 19, 0).getTime()
    expect(isFutureStudyTime("2026-09-12", "18:00", "2026-10-12", now)).toBe(false)
    expect(isFutureStudyTime("", "", "2026-10-12", now)).toBe(false)
    expect(isFutureStudyTime("2026-10-13", "18:00", "2026-10-12", now)).toBe(false)
    expect(isFutureStudyTime("2026-09-12", "20:00", "2026-10-12", now)).toBe(true)
  })
})
