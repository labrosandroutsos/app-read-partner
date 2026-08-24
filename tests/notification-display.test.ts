import { describe, expect, it } from "vitest"
import { markNotificationsReadLocally, mergeNotifications, notificationCopy } from "../lib/notification-display"
import type { AppNotification, NotificationType } from "../lib/types"

const notification = (id: string, type: NotificationType, createdAt: string, readAt: string | null = null): AppNotification => ({
  id,
  user_id: "00000000-0000-4000-8000-000000000001",
  type,
  actor_id: "00000000-0000-4000-8000-000000000002",
  match_id: "00000000-0000-4000-8000-000000000003",
  source_id: id,
  payload: {},
  read_at: readAt,
  created_at: createdAt,
})

describe("notification presentation", () => {
  it("merges duplicate realtime events and keeps newest first", () => {
    const original = notification("00000000-0000-4000-8000-000000000010", "message", "2026-08-24T10:00:00Z")
    const updated = { ...original, read_at: "2026-08-24T10:02:00Z" }
    const newer = notification("00000000-0000-4000-8000-000000000011", "match", "2026-08-24T11:00:00Z")
    expect(mergeNotifications([original], [updated, newer])).toEqual([newer, updated])
  })

  it("marks one notification or all notifications read optimistically", () => {
    const first = notification("00000000-0000-4000-8000-000000000010", "message", "2026-08-24T10:00:00Z")
    const second = notification("00000000-0000-4000-8000-000000000011", "match", "2026-08-24T11:00:00Z")
    const oneRead = markNotificationsReadLocally([first, second], first.id)
    expect(oneRead[0].read_at).not.toBeNull()
    expect(oneRead[1].read_at).toBeNull()
    expect(markNotificationsReadLocally(oneRead).every((item) => item.read_at)).toBe(true)
  })

  it("localizes structured event types without storing rendered text", () => {
    expect(notificationCopy("match", "Alex", "en")).toEqual({ title: "New match", body: "You matched with Alex." })
    expect(notificationCopy("schedule_proposal", "Άννα", "el").title).toBe("Πρόταση μελέτης")
  })
})
