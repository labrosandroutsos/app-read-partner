"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Message } from "@/lib/types"

export function useRealtimeMessages(matchId: string | null, userId: string) {
  const [messages, setMessages] = useState<Message[]>([])

  const mergeMessages = useCallback((incoming: Message[]) => {
    setMessages((current) => {
      const merged = new Map(current.map((message) => [message.id, message]))
      for (const message of incoming) merged.set(message.id, message)
      return Array.from(merged.values()).sort((a, b) => a.created_at.localeCompare(b.created_at))
    })
  }, [])

  const appendMessage = useCallback((message: Message) => mergeMessages([message]), [mergeMessages])

  useEffect(() => {
    if (!matchId) {
      setMessages([])
      return
    }

    const supabase = createClient()
    let active = true
    setMessages([])

    const syncMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true })
      if (active && data) mergeMessages(data)
    }

    // Subscribe first, then merge the initial fetch so an incoming event cannot be overwritten.
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          appendMessage(payload.new as Message)
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void syncMessages()
      })

    void syncMessages()
    const recoveryTimer = window.setInterval(syncMessages, 4000)
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") void syncMessages()
    }
    document.addEventListener("visibilitychange", syncWhenVisible)

    return () => {
      active = false
      window.clearInterval(recoveryTimer)
      document.removeEventListener("visibilitychange", syncWhenVisible)
      void supabase.removeChannel(channel)
    }
  }, [appendMessage, matchId, mergeMessages, userId])

  return { messages, appendMessage }
}
