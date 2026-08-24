"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function useVenueDashboardRealtime(venueId: string) {
  const router = useRouter()

  useEffect(() => {
    const refresh = () => router.refresh()
    const timer = window.setInterval(refresh, 5000)
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh()
    }
    document.addEventListener("visibilitychange", refreshWhenVisible)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [router, venueId])
}
