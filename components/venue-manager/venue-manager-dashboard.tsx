"use client"

import { useEffect, useState, useTransition } from "react"
import { Building2, CalendarClock, CheckCircle2, Clock3, DoorOpen, Loader2, LogOut, MapPin, Percent, UsersRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { signOut, updateManagedVenue } from "@/lib/actions"
import { LanguageToggle } from "@/components/language-toggle"
import { useVenueDashboardRealtime } from "@/hooks/use-venue-dashboard-realtime"
import { useTranslation } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { VenueManagerDashboardData } from "@/lib/types"

interface VenueManagerDashboardProps {
  email: string
  data: VenueManagerDashboardData
}

export function VenueManagerDashboard({ email, data }: VenueManagerDashboardProps) {
  const { locale } = useTranslation()
  const router = useRouter()
  const el = locale === "el"
  const [isOpen, setIsOpen] = useState(data.venue.is_open)
  const [occupancy, setOccupancy] = useState(String(data.venue.occupancy))
  const [discount, setDiscount] = useState(String(data.venue.discount ?? 0))
  const [isPending, startTransition] = useTransition()
  useVenueDashboardRealtime(data.venue.id)

  useEffect(() => {
    setIsOpen(data.venue.is_open)
    setOccupancy(String(data.venue.occupancy))
    setDiscount(String(data.venue.discount ?? 0))
  }, [data.venue.discount, data.venue.is_open, data.venue.occupancy])

  const save = () => {
    const nextOccupancy = Number.parseInt(occupancy, 10)
    const nextDiscount = Number.parseInt(discount, 10)
    if (!Number.isInteger(nextOccupancy) || nextOccupancy < 0 || nextOccupancy > 100 || !Number.isInteger(nextDiscount) || nextDiscount < 0 || nextDiscount > 100) {
      toast.error(el ? "Η πληρότητα και η έκπτωση πρέπει να είναι από 0 έως 100." : "Occupancy and discount must be between 0 and 100.")
      return
    }
    startTransition(async () => {
      try {
        await updateManagedVenue({ isOpen, occupancy: nextOccupancy, discount: nextDiscount || null })
        toast.success(el ? "Ο χώρος ενημερώθηκε." : "Venue updated.")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (el ? "Η ενημέρωση απέτυχε." : "Update failed."))
      }
    })
  }

  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0"><Building2 className="h-5 w-5" /></div>
            <div className="min-w-0">
              <p className="font-bold truncate">Read Partner · {el ? "Διαχείριση χώρου" : "Venue Manager"}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1"><LanguageToggle /><form action={signOut}><Button type="submit" variant="outline" size="sm"><LogOut className="h-4 w-4" />{el ? "Αποσύνδεση" : "Log out"}</Button></form></div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1"><Badge variant={data.venue.is_open ? "default" : "secondary"}>{data.venue.is_open ? (el ? "Ανοιχτό" : "Open") : (el ? "Κλειστό" : "Closed")}</Badge><span className="text-xs text-muted-foreground">{el ? "Ένας λογαριασμός διαχειριστή" : "Single manager account"}</span></div>
            <h1 className="text-2xl sm:text-3xl font-bold">{data.venue.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" />{data.venue.address || (el ? "Δεν έχει οριστεί διεύθυνση" : "No address set")}</p>
          </div>
          <p className="text-xs text-muted-foreground max-w-md">{el ? "Ο διαχειριστής βλέπει μόνο λειτουργικά στοιχεία του χώρου — όχι συνομιλίες ή σημειώσεις φοιτητών." : "Managers only see venue operations—not student chats or notes."}</p>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={UsersRound} label={el ? "Ενεργά check-ins" : "Active check-ins"} value={String(data.activeCheckins)} />
          <StatCard icon={CalendarClock} label={el ? "Επερχόμενες κρατήσεις" : "Upcoming bookings"} value={String(data.upcomingSessions.length)} />
          <StatCard icon={DoorOpen} label={el ? "Πληρότητα" : "Occupancy"} value={`${data.venue.occupancy}%`} />
          <StatCard icon={Percent} label={el ? "Έκπτωση" : "Discount"} value={data.venue.discount ? `${data.venue.discount}%` : "—"} />
        </section>

        <section className="grid lg:grid-cols-[0.9fr_1.1fr] gap-5">
          <Card>
            <CardHeader><CardTitle>{el ? "Έλεγχος χώρου" : "Venue controls"}</CardTitle><CardDescription>{el ? "Ενημέρωσε τη διαθεσιμότητα που βλέπουν οι φοιτητές." : "Update the live information students see."}</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border p-3"><div><Label htmlFor="venue-open">{el ? "Ο χώρος είναι ανοιχτός" : "Venue is open"}</Label><p className="text-xs text-muted-foreground mt-0.5">{el ? "Απενεργοποίησέ το όταν δεν δέχεστε check-ins." : "Turn off when check-ins are unavailable."}</p></div><Switch id="venue-open" checked={isOpen} onCheckedChange={setIsOpen} /></div>
              <div className="space-y-2"><div className="flex justify-between"><Label htmlFor="venue-occupancy">{el ? "Πληρότητα" : "Occupancy"}</Label><span className="text-sm font-semibold">{occupancy || 0}%</span></div><Input id="venue-occupancy" type="range" min="0" max="100" step="1" value={occupancy} onChange={(event) => setOccupancy(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="venue-discount">{el ? "Τρέχουσα έκπτωση (%)" : "Current discount (%)"}</Label><Input id="venue-discount" type="number" min="0" max="100" value={discount} onChange={(event) => setDiscount(event.target.value)} /></div>
              <Button className="w-full" onClick={save} disabled={isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin" />}{el ? "Αποθήκευση αλλαγών" : "Save changes"}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{el ? "Επερχόμενες συναντήσεις" : "Upcoming study sessions"}</CardTitle><CardDescription>{el ? "Ανώνυμη λειτουργική εικόνα των κρατήσεων στον χώρο." : "An anonymized operational view of venue bookings."}</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {data.upcomingSessions.length === 0 ? <EmptyLine text={el ? "Δεν υπάρχουν επερχόμενες συναντήσεις." : "No upcoming sessions."} /> : data.upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Clock3 className="h-4 w-4" /></div><div><p className="text-sm font-medium">{session.starts_at ? new Date(session.starts_at).toLocaleString(el ? "el-GR" : "en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</p><p className="text-xs text-muted-foreground">{session.duration_hours}h · {el ? "2 φοιτητές" : "2 students"}</p></div></div>
                  <Badge variant={session.status === "confirmed" ? "default" : "secondary"}>{session.status === "confirmed" ? (el ? "Επιβεβαιωμένη" : "Confirmed") : (el ? "Πρόταση" : "Proposed")}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid md:grid-cols-2 gap-5">
          <Card><CardHeader><CardTitle>{el ? "Πρόσφατα check-ins" : "Recent check-ins"}</CardTitle></CardHeader><CardContent className="space-y-2">{data.recentCheckins.length === 0 ? <EmptyLine text={el ? "Δεν υπάρχουν check-ins ακόμα." : "No check-ins yet."} /> : data.recentCheckins.map((checkin) => <div key={checkin.id} className="flex items-center justify-between text-sm border-b last:border-0 py-2"><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{new Date(checkin.checked_in_at).toLocaleString(el ? "el-GR" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span><Badge variant="outline">{checkin.checked_out_at ? (el ? "Ολοκληρώθηκε" : "Finished") : (el ? "Ενεργό" : "Active")}</Badge></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>{el ? "Ιστορικό πληρότητας" : "Occupancy history"}</CardTitle></CardHeader><CardContent className="space-y-2">{data.occupancyHistory.length === 0 ? <EmptyLine text={el ? "Δεν υπάρχουν ενημερώσεις ακόμα." : "No updates yet."} /> : data.occupancyHistory.map((report) => <div key={report.id} className="flex items-center justify-between text-sm border-b last:border-0 py-2"><span>{new Date(report.reported_at).toLocaleString(el ? "el-GR" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span><span className="font-semibold">{report.occupancy_pct}%</span></div>)}</CardContent></Card>
        </section>
      </main>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string }) {
  return <Card><CardContent className="p-4"><Icon className="h-5 w-5 text-primary mb-3" /><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground mt-1">{label}</p></CardContent></Card>
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{text}</p>
}
