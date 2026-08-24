import type { AppNotification, NotificationType } from "./types"

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
