"use client"

import { useState } from "react"
import { MapPin } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { ScreenHeading } from "@/components/screen-heading"
import { Button } from "@/components/ui/button"
import { VenueCard } from "./venue-card"
import { useRealtimeVenues } from "@/hooks/use-realtime-venues"
import type { Venue } from "@/lib/types"

const EMPTY_VENUES: Venue[] = []
interface VenuesScreenProps {
  venues?: Venue[]
  initialActiveVenueId?: string | null
  preview?: boolean
}

export function VenuesScreen({ venues = EMPTY_VENUES, initialActiveVenueId = null, preview = false }: VenuesScreenProps) {
  const { t, locale } = useTranslation()
  const el = locale === "el"
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [activeVenueId, setActiveVenueId] = useState<string | null>(initialActiveVenueId)
  const venueList = useRealtimeVenues(venues, !preview)
  const sortedVenues = [...venueList].filter((venue) => !onlyOpen || venue.is_open || venue.id === activeVenueId)
    .sort((a, b) => Number(b.id === activeVenueId) - Number(a.id === activeVenueId) || Number(b.is_open) - Number(a.is_open) || a.name.localeCompare(b.name, locale))
  return <div>
    <ScreenHeading title={t("venues.title")} description={el ? "Βρες τον χώρο για το επόμενο διάβασμά σου." : "Find a place for your next study session."} />
    <div className="mx-5 mb-5 flex items-center gap-2">
      <Button variant={!onlyOpen ? "default" : "outline"} aria-pressed={!onlyOpen} onClick={() => setOnlyOpen(false)}>{el ? "Όλοι οι χώροι" : "All places"}</Button>
      <Button variant={onlyOpen ? "default" : "outline"} aria-pressed={onlyOpen} onClick={() => setOnlyOpen(true)}>{el ? "Ανοιχτά τώρα" : "Open now"}</Button>
    </div>
    <div className="space-y-4 px-5 pb-5">
      {sortedVenues.map((venue) => <VenueCard preview={preview} key={venue.id} venue={venue} checkedIn={activeVenueId === venue.id} onCheckinChange={(active) => setActiveVenueId(active ? venue.id : null)} />)}
      {sortedVenues.length === 0 && <div role="status" className="border-t border-border py-8"><MapPin className="mb-4 h-7 w-7 text-primary" /><h2 className="font-semibold">{el ? "Δεν υπάρχουν διαθέσιμοι χώροι" : "No places to show"}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{onlyOpen ? (el ? "Δες όλους τους χώρους ή δοκίμασε αργότερα." : "View all places or check back later.") : (el ? "Οι χώροι μελέτης θα εμφανιστούν εδώ όταν προστεθούν." : "Study venues will appear here when they’re added.")}</p></div>}
    </div>
  </div>
}
