"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { mergeNotifications, markNotificationsReadLocally, newestUnseenUnreadNotification } from "@/lib/notification-display"
import type { AppNotification } from "@/lib/types"

export function useRealtimeNotifications(
  userId: string,
  initialNotifications: AppNotification[],
) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [incomingNotification, setIncomingNotification] = useState<AppNotification | null>(null)
  const knownNotificationIds = useRef(new Set(initialNotifications.map((notification) => notification.id)))

  useEffect(() => {
    const recoveredNotification = newestUnseenUnreadNotification(
      initialNotifications,
      knownNotificationIds.current,
    )
    setNotifications(initialNotifications)
    for (const notification of initialNotifications) knownNotificationIds.current.add(notification.id)
    if (recoveredNotification) setIncomingNotification(recoveredNotification)
  }, [initialNotifications])

  useEffect(() => {
    const supabase = createClient()
    let active = true

    const syncAll = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*, actor:actor_id(id, display_name, avatar_color)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)
      if (!active || !data) return
      const nextNotifications = data as AppNotification[]
      const recoveredNotification = newestUnseenUnreadNotification(
        nextNotifications,
        knownNotificationIds.current,
      )
      for (const notification of nextNotifications) knownNotificationIds.current.add(notification.id)
      setNotifications(nextNotifications)
      if (recoveredNotification) setIncomingNotification(recoveredNotification)
    }

    const syncOne = async (id: string, announce: boolean) => {
      const { data } = await supabase
        .from("notifications")
        .select("*, actor:actor_id(id, display_name, avatar_color)")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle()
      if (!active || !data) return
      const notification = data as AppNotification
      knownNotificationIds.current.add(notification.id)
      setNotifications((current) => mergeNotifications(current, [notification]))
      if (announce && !notification.read_at) setIncomingNotification(notification)
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") return
          const row = payload.new as AppNotification
          const announce = payload.eventType === "INSERT"
            || (payload.eventType === "UPDATE" && !row.read_at && payload.old.created_at !== row.created_at)
          void syncOne(row.id, announce)
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void syncAll()
      })

    void syncAll()
    const recoveryTimer = window.setInterval(syncAll, 4_000)
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") void syncAll()
    }
    document.addEventListener("visibilitychange", syncWhenVisible)

    return () => {
      active = false
      window.clearInterval(recoveryTimer)
      document.removeEventListener("visibilitychange", syncWhenVisible)
      void supabase.removeChannel(channel)
    }
  }, [userId])

  const markReadLocally = useCallback((notificationId?: string | null) => {
    setNotifications((current) => markNotificationsReadLocally(current, notificationId))
  }, [])
  const clearIncomingNotification = useCallback(() => setIncomingNotification(null), [])

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.read_at).length,
    markReadLocally,
    incomingNotification,
    clearIncomingNotification,
  }
}
