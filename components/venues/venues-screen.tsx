"use client"

import { useMemo, useState } from "react"
import { List, Map } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { VenueCard } from "./venue-card"
import { useRealtimeOccupancy } from "@/hooks/use-realtime-occupancy"
import { useRealtimeVenues } from "@/hooks/use-realtime-venues"
import { cn } from "@/lib/utils"
import type { Venue as DBVenue } from "@/lib/types"
import { venues as mockVenues } from "@/lib/mock-data"

interface VenuesScreenProps {
  venues?: DBVenue[]
  initialActiveVenueId?: string | null
}

export function VenuesScreen({ venues: dbVenues, initialActiveVenueId = null }: VenuesScreenProps) {
  const { t } = useTranslation()
  const [view, setView] = useState<"list" | "map">("list")
  const [activeVenueId, setActiveVenueId] = useState<string | null>(initialActiveVenueId)

  const hasDB = dbVenues && dbVenues.length > 0
  const initialVenueList = useMemo(() => hasDB
    ? dbVenues
    : mockVenues.map(v => ({
        id: v.id, name: v.name, address: v.address, occupancy: v.occupancy,
        discount: v.discount, is_open: v.isOpen, type: v.type, distance: v.distance,
      })), [dbVenues, hasDB])
  const venueList = useRealtimeVenues(initialVenueList)

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
        <div className="px-4 pb-4 flex flex-col gap-3">
          {venuesWithLiveOccupancy.map((venue) => (
            <VenueCard key={venue.id} venue={venue} checkedIn={activeVenueId === venue.id} onCheckinChange={(active) => setActiveVenueId(active ? venue.id : null)} />
          ))}
        </div>
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
