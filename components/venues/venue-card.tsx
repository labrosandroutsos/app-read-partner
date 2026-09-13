"use client"

import { useTransition } from "react"
import { Building2, Coffee, Library, Loader2, LogIn, LogOut, MapPin, Navigation, Users } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { OccupancyBar } from "./occupancy-bar"
import { cn } from "@/lib/utils"
import { toggleVenueCheckin } from "@/lib/actions"
import { toast } from "sonner"

function venueIcon(type: string) {
  const t = type.toLowerCase()
  if (t.includes("caf") || t.includes("coffee") || t.includes("καφ")) return Coffee
  if (t.includes("librar") || t.includes("βιβλ")) return Library
  return Building2
}

interface VenueCardProps {
  preview?: boolean
  venue: {
    id: string
    name: string
    address: string | null
    occupancy: number
    discount: number | null
    is_open: boolean
    type: string
    distance: number
  }
  checkedIn: boolean
  onCheckinChange: (active: boolean) => void
}

export function VenueCard({ preview = false, venue, checkedIn, onCheckinChange }: VenueCardProps) {
  const { t, locale } = useTranslation()
  const [isPending, startTransition] = useTransition()

  const occupancyColor =
    venue.occupancy < 50
      ? "text-emerald-600 dark:text-emerald-400"
      : venue.occupancy < 80
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400"

  const handleCheckin = () => {
    if (isPending) return
    startTransition(async () => {
      try {
        const active = await toggleVenueCheckin(venue.id)
        onCheckinChange(active)
        toast.success(active ? (locale === "el" ? "Έκανες check in!" : "Checked in!") : (locale === "el" ? "Έκανες check out." : "Checked out."))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (locale === "el" ? "Το check-in απέτυχε." : "Check-in failed."))
      }
    })
  }

  const Icon = venueIcon(venue.type)
  const occupancyLabel = venue.occupancy < 50
    ? (locale === "el" ? "Άνετα" : "Quiet")
    : venue.occupancy < 80
    ? (locale === "el" ? "Μέτρια" : "Filling up")
    : (locale === "el" ? "Γεμάτα" : "Busy")

  return (
    <Card className={cn("overflow-hidden py-0 transition-shadow hover:shadow-md", checkedIn ? "border-primary shadow-md" : "shadow-sm")}>
      <CardContent className="flex flex-col gap-3.5 p-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", venue.is_open ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-[15px] leading-snug text-foreground">{venue.name}</h2>
              <span className={cn("mt-0.5 flex shrink-0 items-center gap-1 text-[11px] font-semibold", venue.is_open ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", venue.is_open ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                {venue.is_open ? t("venues.open") : t("venues.closed")}
              </span>
            </div>
            {venue.address && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{venue.address}</span>
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                <Navigation className="h-3 w-3" />{venue.distance} {locale === "el" ? "χλμ" : "km"}
              </span>
              {venue.discount ? (
                <span className="inline-flex items-center rounded-full bg-accent/18 px-2 py-0.5 text-[11px] font-bold text-accent-strong">
                  -{venue.discount}%
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3.5 w-3.5" />{t("venues.occupancy")}</span>
            <span className={cn("font-semibold", occupancyColor)}>{occupancyLabel} · {venue.occupancy}%</span>
          </div>
          <OccupancyBar percentage={venue.occupancy} />
        </div>

        {(venue.is_open || checkedIn) && (
          <Button variant={checkedIn ? "default" : "outline"} size="sm" className="h-11 w-full text-sm" onClick={handleCheckin} disabled={isPending || preview}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : checkedIn ? <LogOut className="h-3.5 w-3.5 mr-1.5" /> : <LogIn className="h-3.5 w-3.5 mr-1.5" />}
            {checkedIn ? (locale === "el" ? "Check out" : "Check out") : t("venues.checkin")}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
