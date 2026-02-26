"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface OccupancyUpdate {
  venue_id: string
  occupancy_pct: number
}

export function useRealtimeOccupancy(venueIds: string[]) {
  const [occupancyMap, setOccupancyMap] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    if (venueIds.length === 0) return

    const supabase = createClient()

    const channel = supabase
      .channel("occupancy-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "occupancy_reports",
        },
        (payload) => {
          const report = payload.new as OccupancyUpdate
          setOccupancyMap((prev) => {
            const next = new Map(prev)
            next.set(report.venue_id, report.occupancy_pct)
            return next
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [venueIds])

  return occupancyMap
}
