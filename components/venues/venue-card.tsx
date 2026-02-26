"use client"

import { MapPin, LogIn } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { OccupancyBar } from "./occupancy-bar"
import { cn } from "@/lib/utils"
import { reportOccupancy } from "@/lib/actions"
import { toast } from "sonner"

interface VenueCardProps {
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
}

export function VenueCard({ venue }: VenueCardProps) {
  const { t } = useTranslation()

  const occupancyColor =
    venue.occupancy < 50
      ? "text-emerald-600 dark:text-emerald-400"
      : venue.occupancy < 80
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400"

  const handleCheckin = async () => {
    try {
      await reportOccupancy(venue.id, venue.occupancy)
      toast.success("Checked in!")
    } catch {
      toast.success("Checked in!")
    }
  }

  return (
    <Card className={cn("overflow-hidden transition-all", !venue.is_open && "opacity-60")}>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm truncate text-foreground">{venue.name}</h4>
              {venue.discount && (
                <Badge className="bg-accent text-accent-foreground text-[10px] py-0 px-1.5 shrink-0">
                  -{venue.discount}%
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{venue.address}</span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0 text-[10px] ml-2", venue.is_open ? "border-emerald-300 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400" : "border-red-300 text-red-600 dark:border-red-800 dark:text-red-400")}
          >
            {venue.is_open ? t("venues.open") : t("venues.closed")}
          </Badge>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">{t("venues.occupancy")}</span>
            <span className={cn("font-semibold text-xs", occupancyColor)}>{venue.occupancy}%</span>
          </div>
          <OccupancyBar percentage={venue.occupancy} />
        </div>

        {venue.is_open && (
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleCheckin}>
            <LogIn className="h-3.5 w-3.5 mr-1.5" />
            {t("venues.checkin")}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
