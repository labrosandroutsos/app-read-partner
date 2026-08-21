"use client"

import { QrCode, Tag } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { coupons as mockCoupons } from "@/lib/mock-data"
import type { Coupon, Venue } from "@/lib/types"

interface CouponsListProps {
  coupons?: Coupon[]
  venues?: Venue[]
}

export function CouponsList({ coupons, venues }: CouponsListProps) {
  const { t } = useTranslation()

  const hasReal = coupons && coupons.length > 0

  const items = hasReal
    ? coupons.map(c => ({
        id: c.id,
        venue: (c as any).venue?.name || venues?.find(v => v.id === c.venue_id)?.name || 'Venue',
        discount: c.discount,
        expiresAt: c.expires_at || '',
      }))
    : mockCoupons.map(c => ({
        id: c.id,
        venue: c.venue,
        discount: c.discount,
        expiresAt: c.expiresAt,
      }))

  return (
    <div className="flex flex-col gap-3">
      {items.map((coupon) => (
        <Card key={coupon.id} className="overflow-hidden">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
              <QrCode className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">{coupon.venue}</span>
              </div>
              <Badge className="mt-1 bg-accent text-accent-foreground">
                <Tag className="h-3 w-3 mr-1" />
                {coupon.discount}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1.5">
                {t("profile.coupons.expires")}: {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString("el-GR") : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
