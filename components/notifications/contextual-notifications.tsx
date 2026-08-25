"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Heart, MessageCircle } from "lucide-react"
import { markNotificationsRead } from "@/lib/actions"
import { MESSAGE_BANNER_TIMEOUT_MS, notificationCopy, notificationMessagePreview, shouldDismissNotificationBanner } from "@/lib/notification-display"
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { AppNotification } from "@/lib/types"

interface ContextualNotificationsProps {
  userId: string
  initialNotifications: AppNotification[]
  activeMatchId: string | null
  onOpenChat: (matchId: string) => void
  onOpenPartner: (notificationId: string) => void
  onIncomingActivity: (notification: AppNotification, isActiveChat: boolean) => void
}

export function ContextualNotifications({
  userId,
  initialNotifications,
  activeMatchId,
  onOpenChat,
  onOpenPartner,
  onIncomingActivity,
}: ContextualNotificationsProps) {
  const { locale } = useTranslation()
  const el = locale === "el"
  const [activityBanner, setActivityBanner] = useState<AppNotification | null>(null)
  const [matchDialog, setMatchDialog] = useState<AppNotification | null>(null)
  const startY = useRef<number | null>(null)
  const dragY = useRef(0)
  const swiped = useRef(false)
  const bannerTimer = useRef<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  const {
    notifications,
    markReadLocally,
    incomingNotification,
    clearIncomingNotification,
  } = useRealtimeNotifications(userId, initialNotifications)

  const markRead = useCallback((notification: AppNotification) => {
    markReadLocally(notification.id)
    void markNotificationsRead(notification.id).catch(() => undefined)
  }, [markReadLocally])

  const openNotification = useCallback((notification: AppNotification) => {
    markRead(notification)
    setActivityBanner(null)
    setMatchDialog(null)
    if (notification.type === "interest") onOpenPartner(notification.id)
    else if (notification.match_id) onOpenChat(notification.match_id)
  }, [markRead, onOpenChat, onOpenPartner])

  const clearBannerTimer = useCallback(() => {
    if (bannerTimer.current === null) return
    window.clearTimeout(bannerTimer.current)
    bannerTimer.current = null
  }, [])

  const scheduleBannerDismiss = useCallback(() => {
    clearBannerTimer()
    bannerTimer.current = window.setTimeout(() => {
      setActivityBanner(null)
      bannerTimer.current = null
    }, MESSAGE_BANNER_TIMEOUT_MS)
  }, [clearBannerTimer])

  useEffect(() => {
    if (!activityBanner) {
      clearBannerTimer()
      return
    }
    scheduleBannerDismiss()
    return clearBannerTimer
  }, [activityBanner, clearBannerTimer, scheduleBannerDismiss])

  useEffect(() => {
    if (!incomingNotification) return
    clearIncomingNotification()
    const isActiveChat = Boolean(
      incomingNotification.match_id
      && incomingNotification.match_id === activeMatchId,
    )
    onIncomingActivity(incomingNotification, isActiveChat)

    if (isActiveChat) {
      markRead(incomingNotification)
      return
    }
    if (incomingNotification.type === "message" || incomingNotification.type === "interest") {
      setActivityBanner(incomingNotification)
      setDragOffset(0)
    } else if (incomingNotification.type === "match") {
      setMatchDialog(incomingNotification)
    }
  }, [activeMatchId, clearIncomingNotification, incomingNotification, markRead, onIncomingActivity])

  useEffect(() => {
    if (!activeMatchId) return
    const unreadForOpenChat = notifications.filter((notification) => (
      notification.match_id === activeMatchId && !notification.read_at
    ))
    for (const notification of unreadForOpenChat) markRead(notification)
  }, [activeMatchId, markRead, notifications])

  const dismissMatch = () => {
    if (matchDialog) markRead(matchDialog)
    setMatchDialog(null)
  }

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    clearBannerTimer()
    startY.current = event.clientY
    dragY.current = 0
    swiped.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (startY.current === null) return
    const nextOffset = Math.min(0, event.clientY - startY.current)
    dragY.current = nextOffset
    if (nextOffset < -8) swiped.current = true
    setDragOffset(nextOffset)
  }

  const onPointerUp = () => {
    startY.current = null
    if (shouldDismissNotificationBanner(dragY.current)) {
      setActivityBanner(null)
    } else {
      setDragOffset(0)
      scheduleBannerDismiss()
    }
  }

  const handleBannerClick = () => {
    if (!activityBanner || swiped.current) return
    openNotification(activityBanner)
  }

  const isInterestBanner = activityBanner?.type === "interest"
  const messageActor = activityBanner?.actor?.display_name?.trim() || (el ? "Φοιτητής" : "Student")
  const messageInitials = isInterestBanner ? "?" : messageActor.slice(0, 2).toUpperCase()
  const activityCopy = activityBanner ? notificationCopy(activityBanner.type, activityBanner.actor?.display_name ?? "", locale) : null
  const matchCopy = matchDialog
    ? notificationCopy("match", matchDialog.actor?.display_name ?? "", locale)
    : null

  return (
    <>
      {activityBanner && activityCopy && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-[70] w-[calc(100%-1.5rem)] max-w-[406px] touch-none select-none"
          style={{
            opacity: Math.max(0.35, 1 + dragOffset / 120),
            transform: `translate(-50%, ${dragOffset}px)`,
            transition: startY.current === null ? "transform 180ms ease, opacity 180ms ease" : "none",
          }}
          onMouseEnter={clearBannerTimer}
          onMouseLeave={scheduleBannerDismiss}
        >
          <button
            type="button"
            onClick={handleBannerClick}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onFocus={clearBannerTimer}
            onBlur={scheduleBannerDismiss}
            className="flex w-full items-center gap-3 rounded-2xl border border-border/80 bg-card/95 px-3 py-3 text-left shadow-xl shadow-black/15 backdrop-blur-xl outline-none ring-primary/30 transition focus-visible:ring-2"
            aria-label={isInterestBanner ? activityCopy.title : (el ? `Άνοιγμα μηνύματος από ${messageActor}` : `Open message from ${messageActor}`)}
          >
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white", activityBanner.actor?.avatar_color || "bg-primary")}>
              {messageInitials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                {isInterestBanner ? <Heart className="h-3.5 w-3.5 text-primary" /> : <MessageCircle className="h-3.5 w-3.5 text-primary" />}
                {isInterestBanner ? activityCopy.title : messageActor}
              </span>
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                {isInterestBanner ? activityCopy.body : notificationMessagePreview(activityBanner, locale)}
              </span>
            </span>
            <span className="shrink-0 text-xs font-medium text-primary">{el ? "Άνοιγμα" : "Open"}</span>
          </button>
          <div className="mx-auto mt-1.5 h-1 w-9 rounded-full bg-muted-foreground/35" aria-hidden="true" />
        </div>
      )}

      <Dialog open={Boolean(matchDialog)} onOpenChange={(open) => { if (!open) dismissMatch() }}>
        <DialogContent className="max-w-[360px] text-center" showCloseButton={false}>
          {matchDialog && matchCopy && (
            <>
              <div className={cn("mx-auto flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold text-white shadow-lg", matchDialog.actor?.avatar_color || "bg-primary")}>
                {(matchDialog.actor?.display_name || "RP").slice(0, 2).toUpperCase()}
              </div>
              <DialogHeader className="text-center sm:text-center">
                <DialogTitle className="text-2xl font-black text-primary">{matchCopy.title}</DialogTitle>
                <DialogDescription>{matchCopy.body}</DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col sm:flex-col">
                <Button className="w-full" onClick={() => openNotification(matchDialog)}>{el ? "Πήγαινε στο Chat" : "Go to Chat"}</Button>
                <Button className="w-full" variant="outline" onClick={dismissMatch}>{el ? "Αργότερα" : "Later"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
