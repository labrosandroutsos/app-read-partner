"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { StudySessionRecord } from "@/lib/types"

export function useRealtimeSchedule(matchId: string | null, initialSchedule: StudySessionRecord | null) {
  const [schedule, setSchedule] = useState<StudySessionRecord | null>(initialSchedule)

  useEffect(() => {
    setSchedule(initialSchedule)
  }, [initialSchedule])

  useEffect(() => {
    if (!matchId) return
    const supabase = createClient()
    let active = true

    const syncSchedule = async () => {
      const { data } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("match_id", matchId)
        .in("status", ["proposed", "confirmed"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (active) setSchedule((data as StudySessionRecord | null) ?? null)
    }

    const channel = supabase
      .channel(`study-schedule:${matchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "study_sessions", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const next = payload.new as StudySessionRecord | undefined
          if (next && (next.status === "proposed" || next.status === "confirmed")) setSchedule(next)
          else setSchedule(null)
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void syncSchedule()
      })

    void syncSchedule()
    const recoveryTimer = window.setInterval(syncSchedule, 4000)
    return () => {
      active = false
      window.clearInterval(recoveryTimer)
      void supabase.removeChannel(channel)
    }
  }, [matchId])

  return schedule
}
