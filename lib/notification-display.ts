import type { AppNotification, NotificationType } from "./types"

export const MESSAGE_BANNER_TIMEOUT_MS = 6_000

export function mergeNotifications(current: AppNotification[], incoming: AppNotification[]): AppNotification[] {
  const merged = new Map(current.map((notification) => [notification.id, notification]))
  for (const notification of incoming) merged.set(notification.id, notification)
  return Array.from(merged.values())
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 50)
}

export function markNotificationsReadLocally(notifications: AppNotification[], notificationId?: string | null): AppNotification[] {
  const readAt = new Date().toISOString()
  return notifications.map((notification) => (
    notification.read_at || (notificationId && notification.id !== notificationId)
      ? notification
      : { ...notification, read_at: readAt }
  ))
}

export function notificationMessagePreview(notification: AppNotification, locale: "el" | "en"): string {
  const preview = notification.payload.message_preview
  if (typeof preview === "string" && preview.trim()) return preview.trim()
  return locale === "el" ? "Σου έστειλε ένα νέο μήνυμα." : "Sent you a new message."
}

export function shouldDismissNotificationBanner(offsetY: number): boolean {
  return offsetY <= -48
}

export function notificationCopy(type: NotificationType, actorName: string, locale: "el" | "en") {
  const name = actorName || (locale === "el" ? "Ένας φοιτητής" : "A student")
  if (locale === "el") {
    if (type === "match") return { title: "Νέο match", body: `Έγινες match με ${name}.` }
    if (type === "message") return { title: "Νέο μήνυμα", body: `Ο/Η ${name} σου έστειλε μήνυμα.` }
    return { title: "Πρόταση μελέτης", body: `Ο/Η ${name} πρότεινε ώρα μελέτης.` }
  }
  if (type === "match") return { title: "New match", body: `You matched with ${name}.` }
  if (type === "message") return { title: "New message", body: `${name} sent you a message.` }
  return { title: "Study proposal", body: `${name} proposed a study time.` }
}
