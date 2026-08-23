"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function useVenueDashboardRealtime(venueId: string) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let refreshTimer: number | undefined
    const refresh = () => {
      window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(() => router.refresh(), 250)
    }

    const channel = supabase
      .channel(`venue-dashboard:${venueId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "venue_checkins", filter: `venue_id=eq.${venueId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "study_sessions", filter: `venue_id=eq.${venueId}` }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "occupancy_reports", filter: `venue_id=eq.${venueId}` }, refresh)
      .subscribe()

    return () => {
      window.clearTimeout(refreshTimer)
      void supabase.removeChannel(channel)
    }
  }, [router, venueId])
}
