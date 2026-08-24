"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { mergeNotifications, markNotificationsReadLocally } from "@/lib/notification-display"
import type { AppNotification } from "@/lib/types"

export function useRealtimeNotifications(
  userId: string,
  initialNotifications: AppNotification[],
) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [incomingNotification, setIncomingNotification] = useState<AppNotification | null>(null)

  useEffect(() => { setNotifications(initialNotifications) }, [initialNotifications])

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
      if (active && data) setNotifications(data as AppNotification[])
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
    const recoveryTimer = window.setInterval(syncAll, 10_000)
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
