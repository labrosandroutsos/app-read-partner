"use client"

import { cn } from "@/lib/utils"

interface OccupancyBarProps {
  percentage: number
  className?: string
}

export function OccupancyBar({ percentage, className }: OccupancyBarProps) {
  const color =
    percentage < 50
      ? "bg-emerald-500"
      : percentage < 80
      ? "bg-amber-500"
      : "bg-red-500"

  return (
    <div className={cn("w-full h-2 rounded-full bg-muted overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
