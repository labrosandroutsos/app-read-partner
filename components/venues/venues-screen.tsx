"use client"

import { useState } from "react"
import { List, Map, MapPin } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { VenueCard } from "./venue-card"
import { useRealtimeOccupancy } from "@/hooks/use-realtime-occupancy"
import { cn } from "@/lib/utils"
import type { Venue as DBVenue } from "@/lib/types"

interface VenuesScreenProps {
  venues?: DBVenue[]
}

export function VenuesScreen({ venues: dbVenues }: VenuesScreenProps) {
  const { t } = useTranslation()
  const [view, setView] = useState<"list" | "map">("list")

  const venueList = dbVenues ?? []
  const sortedVenues = [...venueList].sort((a, b) => a.distance - b.distance)
  const venueIds = sortedVenues.map(v => v.id)
  const occupancyUpdates = useRealtimeOccupancy(venueIds)

  const venuesWithLiveOccupancy = sortedVenues.map(v => ({
    ...v,
    occupancy: occupancyUpdates.get(v.id) ?? v.occupancy,
  }))

  return (
    <div>
      <div className="px-4 py-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{t("venues.title")}</h2>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 px-3 rounded-none text-xs", view === "list" && "bg-muted")}
            onClick={() => setView("list")}
          >
            <List className="h-3.5 w-3.5 mr-1" />
            {t("venues.list")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 px-3 rounded-none text-xs", view === "map" && "bg-muted")}
            onClick={() => setView("map")}
          >
            <Map className="h-3.5 w-3.5 mr-1" />
            {t("venues.map")}
          </Button>
        </div>
      </div>

      {view === "list" ? (
        venuesWithLiveOccupancy.length > 0 ? (
          <div className="px-4 pb-4 flex flex-col gap-3">
            {venuesWithLiveOccupancy.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <MapPin className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{t("venues.title")}</h3>
            <p className="text-sm text-muted-foreground">No venues available yet.</p>
          </div>
        )
      ) : (
        <div className="mx-4 mb-4 h-80 rounded-xl bg-muted border border-border flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Map className="h-12 w-12 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{t("venues.map.placeholder")}</p>
          </div>
        </div>
      )}
    </div>
  )
}
