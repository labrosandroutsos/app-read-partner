"use client"

import { ScreenHeading } from "@/components/screen-heading"
import { useState } from "react"
import { useTheme } from "next-themes"
import { Globe, LogOut, Moon, Sun, Monitor } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { ProfileHeader } from "./profile-header"
import { StudyStats } from "./study-stats"
import { PastPartners } from "./past-partners"
import { CouponsList } from "./coupons-list"
import { CalendarView } from "./calendar-view"
import { AccountSettingsDialog } from "./account-settings-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/actions"
import type { Profile, Subject, Venue, Coupon, StudySessionRecord, BlockedUser } from "@/lib/types"

interface ProfileScreenProps {
  preview?: boolean
  userId: string
  email: string
  authProvider: string
  profile: Profile | null
  studyStats: { subject: string; hours: number }[]
  pastPartners: { profile: Profile; sessions: number }[]
  coupons: Coupon[]
  studySessions: StudySessionRecord[]
  subjects: Subject[]
  venues: Venue[]
  blockedUsers: BlockedUser[]
}

export function ProfileScreen({
  preview = false, userId, email, authProvider, profile, studyStats, pastPartners: partners,
  coupons, studySessions, subjects, venues, blockedUsers
}: ProfileScreenProps) {
  const { t, locale, setLocale } = useTranslation()
  const { setTheme, resolvedTheme, theme } = useTheme()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="pb-4">
      <ScreenHeading title={locale === "el" ? "Το διάβασμά σου" : "Your study space"} description={locale === "el" ? "Τα πλάνα, η πρόοδος και οι άνθρωποί σου." : "Your plans, progress, and study partners."} />
      <ProfileHeader profile={profile} onOpenSettings={() => setSettingsOpen(true)} />

      <div className="px-5">
        <Accordion type="multiple" defaultValue={["calendar"]} className="w-full">
          <AccordionItem value="calendar">
            <AccordionTrigger className="min-h-14 text-base font-semibold">{t("profile.calendar")}</AccordionTrigger>
            <AccordionContent>
              <CalendarView studySessions={studySessions} userId={userId} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="stats">
            <AccordionTrigger className="min-h-14 text-base font-semibold">{t("profile.stats")}</AccordionTrigger>
            <AccordionContent>
              <StudyStats stats={studyStats} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="partners">
            <AccordionTrigger className="min-h-14 text-base font-semibold">{t("profile.partners")}</AccordionTrigger>
            <AccordionContent>
              <PastPartners partners={partners} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="coupons">
            <AccordionTrigger className="min-h-14 text-base font-semibold">{t("profile.coupons")}</AccordionTrigger>
            <AccordionContent>
              <CouponsList coupons={coupons} venues={venues} />
            </AccordionContent>
          </AccordionItem>


        </Accordion>
      </div>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto max-w-[760px] mx-auto rounded-t-2xl px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <SheetHeader>
            <SheetTitle>{t("profile.settings")}</SheetTitle>
            <SheetDescription className="sr-only">{t("profile.settings.description")}</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4" />
                {t("profile.settings.language")}
              </label>
              <div className="flex gap-2">
                <Button variant={locale === "el" ? "default" : "outline"} size="sm" onClick={() => setLocale("el")} className="h-11 flex-1">
                  Ελληνικά
                </Button>
                <Button variant={locale === "en" ? "default" : "outline"} size="sm" onClick={() => setLocale("en")} className="h-11 flex-1">
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
                    variant={theme === opt.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme(opt.key)}
                    aria-pressed={theme === opt.key}
                    className={cn("h-11 flex-1 gap-1.5")}
                  >
                    <opt.icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {!preview && <AccountSettingsDialog email={email} authProvider={authProvider} profile={profile} blockedUsers={blockedUsers} />}

            {!preview && <form action={signOut}>
              <Button type="submit" variant="outline" className="w-full text-destructive hover:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                {t("profile.settings.logout")}
              </Button>
            </form>}
            {preview && <p className="text-sm text-muted-foreground">{locale === "el" ? "Οι αλλαγές λογαριασμού δεν είναι διαθέσιμες στην προεπισκόπηση." : "Account changes are unavailable in the preview."}</p>}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
