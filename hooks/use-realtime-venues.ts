"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Venue } from "@/lib/types"

export function useRealtimeVenues(initialVenues: Venue[], enabled = true) {
  const [venues, setVenues] = useState(initialVenues)

  useEffect(() => setVenues(initialVenues), [initialVenues])

  useEffect(() => {
    if (!enabled) return
    const supabase = createClient()
    const channel = supabase
      .channel("venue-details")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "venues" }, (payload) => {
        const updated = payload.new as Venue
        setVenues((current) => current.map((venue) => venue.id === updated.id ? updated : venue))
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [enabled])

  return venues
}
