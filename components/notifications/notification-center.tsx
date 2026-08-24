"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { Bell, CalendarClock, CheckCheck, MessageCircle, UserRoundCheck } from "lucide-react"
import { toast } from "sonner"
import { markNotificationsRead } from "@/lib/actions"
import { notificationCopy } from "@/lib/notification-display"
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { AppNotification } from "@/lib/types"

interface NotificationCenterProps {
  userId: string
  initialNotifications: AppNotification[]
  activeMatchId: string | null
  onOpenChat: (matchId: string) => void
}

export function NotificationCenter({ userId, initialNotifications, activeMatchId, onOpenChat }: NotificationCenterProps) {
  const { locale } = useTranslation()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()
  const el = locale === "el"

  const { notifications, unreadCount, markReadLocally, incomingNotification, clearIncomingNotification } = useRealtimeNotifications(userId, initialNotifications)

  const openNotification = useCallback((notification: AppNotification) => {
    markReadLocally(notification.id)
    startTransition(async () => {
      try { await markNotificationsRead(notification.id) }
      catch { toast.error(el ? "Δεν ήταν δυνατή η ενημέρωση της ειδοποίησης." : "The notification could not be updated.") }
    })
    setOpen(false)
    if (notification.match_id) onOpenChat(notification.match_id)
  }, [el, markReadLocally, onOpenChat])

  useEffect(() => {
    if (!incomingNotification) return
    clearIncomingNotification()
    if (incomingNotification.match_id && incomingNotification.match_id === activeMatchId) {
      markReadLocally(incomingNotification.id)
      void markNotificationsRead(incomingNotification.id)
      return
    }
    const copy = notificationCopy(incomingNotification.type, incomingNotification.actor?.display_name ?? "", locale)
    toast(copy.title, {
      description: copy.body,
      action: incomingNotification.match_id ? { label: el ? "Προβολή" : "View", onClick: () => openNotification(incomingNotification) } : undefined,
    })
  }, [activeMatchId, clearIncomingNotification, el, incomingNotification, locale, markReadLocally, openNotification])

  const markAll = () => {
    markReadLocally()
    startTransition(async () => {
      try { await markNotificationsRead() }
      catch { toast.error(el ? "Δεν ήταν δυνατή η ενημέρωση των ειδοποιήσεων." : "Notifications could not be updated.") }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label={el ? "Ειδοποιήσεις" : "Notifications"}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full max-w-[430px] gap-0 p-0" side="right">
        <SheetHeader className="border-b pr-12">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle>{el ? "Ειδοποιήσεις" : "Notifications"}</SheetTitle>
            {unreadCount > 0 && <Button size="sm" variant="ghost" onClick={markAll}><CheckCheck className="h-4 w-4" />{el ? "Όλα διαβασμένα" : "Mark all read"}</Button>}
          </div>
          <SheetDescription>{el ? "Matches, μηνύματα και προτάσεις μελέτης." : "Matches, messages, and study proposals."}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100dvh-6rem)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-20 text-center text-muted-foreground"><Bell className="h-9 w-9" /><p className="text-sm">{el ? "Δεν υπάρχουν ειδοποιήσεις ακόμα." : "No notifications yet."}</p></div>
          ) : notifications.map((notification) => {
            const copy = notificationCopy(notification.type, notification.actor?.display_name ?? "", locale)
            const Icon = notification.type === "match" ? UserRoundCheck : notification.type === "message" ? MessageCircle : CalendarClock
            return (
              <button key={notification.id} onClick={() => openNotification(notification)} className={cn("flex w-full gap-3 border-b px-4 py-4 text-left transition-colors hover:bg-muted/50", !notification.read_at && "bg-primary/5")}>
                <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", notification.type === "match" ? "bg-emerald-500/15 text-emerald-600" : notification.type === "message" ? "bg-primary/15 text-primary" : "bg-amber-500/15 text-amber-600")}><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="text-sm font-semibold">{copy.title}</span>{!notification.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}</span><span className="mt-0.5 block text-sm text-muted-foreground">{copy.body}</span><time className="mt-1.5 block text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString(el ? "el-GR" : "en-GB", { dateStyle: "short", timeStyle: "short" })}</time></span>
              </button>
            )
          })}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
