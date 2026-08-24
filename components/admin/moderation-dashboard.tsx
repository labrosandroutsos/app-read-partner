"use client"

import { useTransition } from "react"
import Link from "next/link"
import { AlertTriangle, Ban, CheckCircle2, Eye, EyeOff, FileWarning, Loader2, RotateCcw, ShieldAlert, UserRoundX } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { moderateNoteReport, resolveUserReport, setUserSuspension } from "@/lib/actions"
import { calculateSuspensionEnd } from "@/lib/admin-permissions"
import { useTranslation } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ModerationDashboardData } from "@/lib/types"

export function ModerationDashboard({ data }: { data: ModerationDashboardData }) {
  const { locale } = useTranslation()
  const router = useRouter()
  const el = locale === "el"
  const [pending, startTransition] = useTransition()

  const run = (action: () => Promise<void>, success: string) => {
    startTransition(async () => {
      try { await action(); toast.success(success); router.refresh() }
      catch (error) { toast.error(error instanceof Error ? error.message : (el ? "Η ενέργεια απέτυχε." : "Action failed.")) }
    })
  }

  const suspend = (userId: string, days: number | null) => {
    if (!window.confirm(el ? "Να ανασταλεί αυτός ο λογαριασμός;" : "Suspend this account?")) return
    const reason = window.prompt(el ? "Αιτία αναστολής:" : "Suspension reason:")?.trim()
    if (!reason) return
    const until = calculateSuspensionEnd(days)
    run(() => setUserSuspension({ userId, suspended: true, reason, suspendedUntil: until }), el ? "Ο λογαριασμός ανεστάλη." : "Account suspended.")
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <Stat icon={FileWarning} label={el ? "Αναφορές σημειώσεων" : "Note reports"} value={data.noteReports.length} />
        <Stat icon={ShieldAlert} label={el ? "Αναφορές χρηστών" : "User reports"} value={data.userReports.length} />
        <Stat icon={Ban} label={el ? "Ενεργές αναστολές" : "Active suspensions"} value={data.activeSuspensions.length} />
      </section>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">{el ? "Χρήστες" : "Users"} ({data.userReports.length})</TabsTrigger>
          <TabsTrigger value="notes">{el ? "Σημειώσεις" : "Notes"} ({data.noteReports.length})</TabsTrigger>
          <TabsTrigger value="suspensions">{el ? "Αναστολές" : "Suspensions"} ({data.activeSuspensions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-3 pt-3">
          {data.userReports.length === 0 ? <Empty text={el ? "Δεν υπάρχουν ανοικτές αναφορές χρηστών." : "No open user reports."} /> : data.userReports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><CardTitle className="text-base">{report.reported?.display_name || (el ? "Χρήστης" : "User")}</CardTitle><CardDescription>{formatReason(report.reason)} · {new Date(report.created_at).toLocaleString(el ? "el-GR" : "en-GB")}</CardDescription></div>
                  <Badge variant="destructive">{el ? "Ανοικτή" : "Open"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="rounded-lg bg-muted p-3 text-sm">{report.details || (el ? "Δεν δόθηκαν λεπτομέρειες." : "No details supplied.")}</p>
                <p className="text-xs text-muted-foreground">{el ? "Αναφορά από" : "Reported by"}: {report.reporter?.display_name || report.reporter_id}</p>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={pending} size="sm" onClick={() => run(() => resolveUserReport(report.id, "reviewed"), el ? "Η αναφορά εξετάστηκε." : "Report marked reviewed.")}><CheckCircle2 className="h-4 w-4" />{el ? "Εξετάστηκε" : "Mark reviewed"}</Button>
                  <Button disabled={pending} size="sm" variant="outline" onClick={() => run(() => resolveUserReport(report.id, "dismissed"), el ? "Η αναφορά απορρίφθηκε." : "Report dismissed.")}>{el ? "Απόρριψη" : "Dismiss"}</Button>
                  <Button disabled={pending} size="sm" variant="destructive" onClick={() => suspend(report.reported_id, 7)}><UserRoundX className="h-4 w-4" />{el ? "Αναστολή 7 ημερών" : "Suspend 7 days"}</Button>
                  <Button disabled={pending} size="sm" variant="destructive" onClick={() => suspend(report.reported_id, null)}>{el ? "Μόνιμη αναστολή" : "Suspend indefinitely"}</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="notes" className="space-y-3 pt-3">
          {data.noteReports.length === 0 ? <Empty text={el ? "Δεν υπάρχουν ανοικτές αναφορές σημειώσεων." : "No open note reports."} /> : data.noteReports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><CardTitle className="text-base">{report.note?.title || (el ? "Σημείωση" : "Note")}</CardTitle><CardDescription>{el ? "Συγγραφέας" : "Author"}: {report.note?.author?.display_name || report.note?.author_id}</CardDescription></div><Badge variant={report.note?.moderation_status === "hidden" ? "secondary" : "destructive"}>{report.note?.moderation_status === "hidden" ? (el ? "Κρυφή" : "Hidden") : (el ? "Ορατή" : "Visible")}</Badge></div></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-medium">{formatReason(report.reason)}</p>
                <p className="rounded-lg bg-muted p-3 text-sm">{report.details || (el ? "Δεν δόθηκαν λεπτομέρειες." : "No details supplied.")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild disabled={pending} size="sm" variant="outline"><Link href={`/api/notes/${report.note_id}/preview`} target="_blank"><Eye className="h-4 w-4" />{el ? "Προεπισκόπηση" : "Preview"}</Link></Button>
                  {report.note?.moderation_status === "hidden" ? <Button disabled={pending} size="sm" onClick={() => run(() => moderateNoteReport(report.id, "restore"), el ? "Η σημείωση επανήλθε." : "Note restored.")}><RotateCcw className="h-4 w-4" />{el ? "Επαναφορά" : "Restore"}</Button> : <Button disabled={pending} size="sm" variant="destructive" onClick={() => run(() => moderateNoteReport(report.id, "hide"), el ? "Η σημείωση αποκρύφθηκε." : "Note hidden.")}><EyeOff className="h-4 w-4" />{el ? "Απόκρυψη" : "Hide note"}</Button>}
                  <Button disabled={pending} size="sm" variant="outline" onClick={() => run(() => moderateNoteReport(report.id, "dismiss"), el ? "Η αναφορά απορρίφθηκε." : "Report dismissed.")}>{el ? "Απόρριψη αναφοράς" : "Dismiss report"}</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="suspensions" className="space-y-3 pt-3">
          {data.activeSuspensions.length === 0 ? <Empty text={el ? "Δεν υπάρχουν ενεργές αναστολές." : "No active suspensions."} /> : data.activeSuspensions.map((suspension) => (
            <Card key={suspension.id}><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{suspension.user?.display_name || suspension.user_id}</p><p className="text-sm text-muted-foreground">{suspension.reason}</p><p className="mt-1 text-xs text-muted-foreground">{suspension.suspended_until ? `${el ? "Έως" : "Until"} ${new Date(suspension.suspended_until).toLocaleString(el ? "el-GR" : "en-GB")}` : (el ? "Χωρίς ημερομηνία λήξης" : "No end date")}</p></div><Button disabled={pending} variant="outline" onClick={() => run(() => setUserSuspension({ userId: suspension.user_id, suspended: false }), el ? "Η αναστολή άρθηκε." : "Suspension lifted.")}><RotateCcw className="h-4 w-4" />{el ? "Άρση" : "Lift suspension"}</Button></CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>
      {pending && <div className="fixed bottom-4 right-4 rounded-full border bg-card p-3 shadow-lg"><Loader2 className="h-5 w-5 animate-spin" /></div>}
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof AlertTriangle; label: string; value: number }) {
  return <Card><CardContent className="p-4"><Icon className="mb-3 h-5 w-5 text-primary" /><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>
}

function Empty({ text }: { text: string }) { return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">{text}</CardContent></Card> }
function formatReason(reason: string) { return reason.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()) }
