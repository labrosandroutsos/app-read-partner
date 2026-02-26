"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Globe, LogOut, Moon, Sun, Monitor } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { ProfileHeader } from "./profile-header"
import { StudyStats } from "./study-stats"
import { PastPartners } from "./past-partners"
import { CouponsList } from "./coupons-list"
import { CalendarView } from "./calendar-view"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/actions"
import type { Profile, Subject, Venue, Coupon, StudySessionRecord } from "@/lib/types"

interface ProfileScreenProps {
  userId: string
  profile: Profile | null
  studyStats: { subject: string; hours: number }[]
  pastPartners: { profile: Profile; sessions: number }[]
  coupons: Coupon[]
  studySessions: StudySessionRecord[]
  subjects: Subject[]
  venues: Venue[]
}

export function ProfileScreen({
  userId, profile, studyStats, pastPartners: partners,
  coupons, studySessions, subjects, venues
}: ProfileScreenProps) {
  const { t, locale, setLocale } = useTranslation()
  const { setTheme, resolvedTheme } = useTheme()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="pb-4">
      <ProfileHeader profile={profile} onOpenSettings={() => setSettingsOpen(true)} />

      <div className="px-4">
        <Accordion type="multiple" defaultValue={["stats", "partners", "coupons"]} className="w-full">
          <AccordionItem value="stats">
            <AccordionTrigger className="text-sm font-semibold">{t("profile.stats")}</AccordionTrigger>
            <AccordionContent>
              <StudyStats stats={studyStats} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="partners">
            <AccordionTrigger className="text-sm font-semibold">{t("profile.partners")}</AccordionTrigger>
            <AccordionContent>
              <PastPartners partners={partners} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="coupons">
            <AccordionTrigger className="text-sm font-semibold">{t("profile.coupons")}</AccordionTrigger>
            <AccordionContent>
              <CouponsList coupons={coupons} venues={venues} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="calendar">
            <AccordionTrigger className="text-sm font-semibold">{t("profile.calendar")}</AccordionTrigger>
            <AccordionContent>
              <CalendarView studySessions={studySessions} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="bottom" className="max-w-[430px] mx-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t("profile.settings")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4" />
                {t("profile.settings.language")}
              </label>
              <div className="flex gap-2">
                <Button variant={locale === "el" ? "default" : "outline"} size="sm" onClick={() => setLocale("el")} className="flex-1">
                  Ελληνικά
                </Button>
                <Button variant={locale === "en" ? "default" : "outline"} size="sm" onClick={() => setLocale("en")} className="flex-1">
                  English
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                {resolvedTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                {t("profile.settings.theme")}
              </label>
              <div className="flex gap-2">
                {[
                  { key: "light", label: t("profile.settings.theme.light"), icon: Sun },
                  { key: "dark", label: t("profile.settings.theme.dark"), icon: Moon },
                  { key: "system", label: t("profile.settings.theme.system"), icon: Monitor },
                ].map((opt) => (
                  <Button
                    key={opt.key}
                    variant={resolvedTheme === opt.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme(opt.key)}
                    className={cn("flex-1 gap-1.5")}
                  >
                    <opt.icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <form action={signOut}>
              <Button type="submit" variant="outline" className="w-full text-destructive hover:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                {t("profile.settings.logout")}
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
