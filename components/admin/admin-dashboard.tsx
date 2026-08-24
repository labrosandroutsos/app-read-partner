"use client"

import { useMemo, useState, useTransition } from "react"
import { Ban, Building2, FileClock, Loader2, RotateCcw, Save, Settings, ShieldCheck, UserCog, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { adminAssignVenueManager, adminSetUserRole, adminUpdateAutoHideThreshold, adminUpsertVenue, setUserSuspension } from "@/lib/actions"
import { calculateSuspensionEnd, canAssignStaffRole, canAssignVenueManager, canSuspendTarget } from "@/lib/admin-permissions"
import { useTranslation } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AdminDashboardData, AppRole, Venue } from "@/lib/types"

export function AdminDashboard({ data, currentUserId }: { data: AdminDashboardData; currentUserId: string }) {
  const { locale } = useTranslation()
  const router = useRouter()
  const el = locale === "el"
  const [pending, startTransition] = useTransition()
  const [roleUserId, setRoleUserId] = useState("")
  const [role, setRole] = useState<AppRole | "student">("moderator")
  const [managerUserId, setManagerUserId] = useState("")
  const [managerVenueId, setManagerVenueId] = useState("")
  const [suspensionUserId, setSuspensionUserId] = useState("")
  const [threshold, setThreshold] = useState(String(Number(data.settings.moderation_auto_hide_threshold ?? 3)))

  const run = (action: () => Promise<void>, success: string) => startTransition(async () => {
    try { await action(); toast.success(success); router.refresh() }
    catch (error) { toast.error(error instanceof Error ? error.message : (el ? "Η ενέργεια απέτυχε." : "Action failed.")) }
  })

  const suspendedUserIds = useMemo(() => new Set(data.activeSuspensions.map((suspension) => suspension.user_id)), [data.activeSuspensions])
  const selectableStaffAccounts = useMemo(
    () => data.accounts.filter((account) => canAssignStaffRole(account, currentUserId) && !suspendedUserIds.has(account.profile.id)),
    [data.accounts, currentUserId, suspendedUserIds],
  )
  const managerAccounts = useMemo(
    () => data.accounts.filter((account) => canAssignVenueManager(account) && !suspendedUserIds.has(account.profile.id)),
    [data.accounts, suspendedUserIds],
  )
  const suspendableAccounts = useMemo(
    () => data.accounts.filter((account) => canSuspendTarget("admin", account.role, Boolean(account.managedVenueId), account.profile.id === currentUserId)),
    [data.accounts, currentUserId],
  )
  const selectedSuspension = data.activeSuspensions.find((suspension) => suspension.user_id === suspensionUserId)

  const suspendAccount = (days: number | null) => {
    if (!suspensionUserId || !window.confirm(el ? "Να ανασταλεί αυτός ο λογαριασμός;" : "Suspend this account?")) return
    const reason = window.prompt(el ? "Αιτία αναστολής:" : "Suspension reason:")?.trim()
    if (!reason) return
    run(
      () => setUserSuspension({ userId: suspensionUserId, suspended: true, reason, suspendedUntil: calculateSuspensionEnd(days) }),
      el ? "Ο λογαριασμός ανεστάλη." : "Account suspended.",
    )
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label={el ? "Λογαριασμοί" : "Accounts"} value={data.accounts.length} />
        <Stat icon={ShieldCheck} label={el ? "Προσωπικό" : "Staff"} value={data.accounts.filter((a) => a.role).length} />
        <Stat icon={Building2} label={el ? "Χώροι" : "Venues"} value={data.venues.length} />
        <Stat icon={FileClock} label={el ? "Ανοικτές αναφορές" : "Open reports"} value={data.noteReports.length + data.userReports.length} />
      </section>

      <Tabs defaultValue="roles">
        <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="roles">{el ? "Ρόλοι" : "Roles"}</TabsTrigger>
          <TabsTrigger value="venues">{el ? "Χώροι" : "Venues"}</TabsTrigger>
          <TabsTrigger value="settings">{el ? "Ρυθμίσεις" : "Settings"}</TabsTrigger>
          <TabsTrigger value="audit">{el ? "Ιστορικό" : "Audit log"}</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="grid gap-5 pt-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{el ? "Ρόλοι προσωπικού" : "Staff roles"}</CardTitle><CardDescription>{el ? "Οι admins έχουν και όλες τις δυνατότητες moderator." : "Admins inherit every moderator capability."}</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Field label={el ? "Λογαριασμός" : "Account"}><select value={roleUserId} onChange={(e) => setRoleUserId(e.target.value)} className={selectClass}><option value="">{el ? "Επίλεξε λογαριασμό" : "Select account"}</option>{selectableStaffAccounts.map((account) => <option key={account.profile.id} value={account.profile.id}>{account.profile.display_name || "Student"} · {shortId(account.profile.id)}{account.role ? ` · ${account.role}` : ""}</option>)}</select></Field>
              <Field label={el ? "Νέος ρόλος" : "New role"}><select value={role} onChange={(e) => setRole(e.target.value as AppRole | "student")} className={selectClass}><option value="student">{el ? "Φοιτητής (χωρίς ρόλο)" : "Student (no staff role)"}</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select></Field>
              <Button className="w-full" disabled={!roleUserId || pending} onClick={() => run(() => adminSetUserRole(roleUserId, role === "student" ? null : role), el ? "Ο ρόλος ενημερώθηκε." : "Role updated.")}><UserCog className="h-4 w-4" />{el ? "Αποθήκευση ρόλου" : "Save role"}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{el ? "Ανάθεση διαχειριστή χώρου" : "Venue-manager assignment"}</CardTitle><CardDescription>{el ? "Κάθε χώρος και κάθε manager έχουν μόνο μία ενεργή ανάθεση." : "Each venue and manager has exactly one active assignment."}</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Field label={el ? "Λογαριασμός" : "Account"}><select value={managerUserId} onChange={(e) => setManagerUserId(e.target.value)} className={selectClass}><option value="">{el ? "Επίλεξε λογαριασμό" : "Select account"}</option>{managerAccounts.map((account) => <option key={account.profile.id} value={account.profile.id}>{account.profile.display_name || "Student"} · {shortId(account.profile.id)}{account.managedVenueId ? ` · ${el ? "ήδη manager" : "already manager"}` : ""}</option>)}</select></Field>
              <Field label={el ? "Χώρος" : "Venue"}><select value={managerVenueId} onChange={(e) => setManagerVenueId(e.target.value)} className={selectClass}><option value="">{el ? "Καμία ανάθεση / αφαίρεση" : "No assignment / remove"}</option>{data.venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}</select></Field>
              <Button className="w-full" disabled={!managerUserId || pending} onClick={() => run(() => adminAssignVenueManager(managerUserId, managerVenueId || null), el ? "Η ανάθεση ενημερώθηκε." : "Assignment updated.")}><Building2 className="h-4 w-4" />{el ? "Αποθήκευση ανάθεσης" : "Save assignment"}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{el ? "Περιορισμός λογαριασμού" : "Account restriction"}</CardTitle><CardDescription>{el ? "Οι admins μπορούν να αναστείλουν φοιτητές, moderators και venue managers, αλλά όχι άλλους admins." : "Admins can suspend students, moderators, and venue managers, but never another admin."}</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Field label={el ? "Λογαριασμός" : "Account"}><select value={suspensionUserId} onChange={(e) => setSuspensionUserId(e.target.value)} className={selectClass}><option value="">{el ? "Επίλεξε λογαριασμό" : "Select account"}</option>{suspendableAccounts.map((account) => <option key={account.profile.id} value={account.profile.id}>{account.profile.display_name || "Student"} · {shortId(account.profile.id)}{suspendedUserIds.has(account.profile.id) ? ` · ${el ? "σε αναστολή" : "suspended"}` : ""}</option>)}</select></Field>
              {selectedSuspension ? <Button className="w-full" disabled={pending} variant="outline" onClick={() => run(() => setUserSuspension({ userId: suspensionUserId, suspended: false }), el ? "Η αναστολή άρθηκε." : "Suspension lifted.")}><RotateCcw className="h-4 w-4" />{el ? "Άρση αναστολής" : "Lift suspension"}</Button> : <div className="grid gap-2 sm:grid-cols-2"><Button disabled={!suspensionUserId || pending} variant="destructive" onClick={() => suspendAccount(7)}><Ban className="h-4 w-4" />{el ? "7 ημέρες" : "Suspend 7 days"}</Button><Button disabled={!suspensionUserId || pending} variant="destructive" onClick={() => suspendAccount(null)}>{el ? "Χωρίς λήξη" : "No end date"}</Button></div>}
            </CardContent>
          </Card>

          <Card><CardHeader><CardTitle>{el ? "Τρέχον προσωπικό" : "Current staff"}</CardTitle></CardHeader><CardContent className="space-y-2">{data.accounts.filter((a) => a.role || a.managedVenueId).length === 0 ? <Empty text={el ? "Δεν έχουν ανατεθεί ρόλοι." : "No roles assigned."} /> : data.accounts.filter((a) => a.role || a.managedVenueId).map((account) => <div key={account.profile.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-3 last:border-0"><div><p className="font-medium">{account.profile.display_name || "Student"}</p><p className="text-xs text-muted-foreground">{shortId(account.profile.id)}</p></div><Badge variant={account.role === "admin" ? "default" : "secondary"}>{account.role ?? (el ? "Διαχειριστής χώρου" : "Venue manager")}</Badge></div>)}</CardContent></Card>
        </TabsContent>

        <TabsContent value="venues" className="space-y-4 pt-4">
          <VenueEditor venue={null} pending={pending} onSave={(form) => run(() => adminUpsertVenue(form), el ? "Ο χώρος δημιουργήθηκε." : "Venue created.")} el={el} />
          <div className="grid gap-4 lg:grid-cols-2">{data.venues.map((venue) => <VenueEditor key={venue.id} venue={venue} pending={pending} onSave={(form) => run(() => adminUpsertVenue(form), el ? "Ο χώρος ενημερώθηκε." : "Venue updated.")} el={el} />)}</div>
        </TabsContent>

        <TabsContent value="settings" className="pt-4">
          <Card className="max-w-xl"><CardHeader><CardTitle>{el ? "Αυτόματη απόκρυψη σημειώσεων" : "Automatic note hiding"}</CardTitle><CardDescription>{el ? "Πόσες ανοικτές αναφορές απαιτούνται πριν κρυφτεί αυτόματα μια σημείωση." : "Number of open reports required before a note is hidden automatically."}</CardDescription></CardHeader><CardContent className="space-y-4"><Field label={el ? "Όριο αναφορών" : "Report threshold"}><Input type="number" min="1" max="20" value={threshold} onChange={(e) => setThreshold(e.target.value)} /></Field><Button disabled={pending} onClick={() => run(() => adminUpdateAutoHideThreshold(Number(threshold)), el ? "Η ρύθμιση ενημερώθηκε." : "Setting updated.")}><Settings className="h-4 w-4" />{el ? "Αποθήκευση" : "Save setting"}</Button></CardContent></Card>
        </TabsContent>

        <TabsContent value="audit" className="pt-4">
          <Card><CardHeader><CardTitle>{el ? "Αμετάβλητο ιστορικό ενεργειών" : "Immutable moderation audit log"}</CardTitle><CardDescription>{el ? "Οι καταχωρίσεις δεν μπορούν να τροποποιηθούν ή να διαγραφούν." : "Entries cannot be edited or deleted."}</CardDescription></CardHeader><CardContent className="space-y-1">{data.auditLog.length === 0 ? <Empty text={el ? "Δεν υπάρχουν ενέργειες ακόμα." : "No actions yet."} /> : data.auditLog.map((entry) => <div key={entry.id} className="grid gap-1 border-b py-3 text-sm last:border-0 sm:grid-cols-[1fr_1fr_auto]"><div><p className="font-medium">{entry.action.replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">{entry.actor?.display_name || entry.actor_id}</p></div><div className="text-xs text-muted-foreground"><p>{entry.target_type}{entry.target_id ? ` · ${shortId(entry.target_id)}` : ""}</p><p className="truncate">{JSON.stringify(entry.details)}</p></div><time className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString(el ? "el-GR" : "en-GB")}</time></div>)}</CardContent></Card>
        </TabsContent>
      </Tabs>
      {pending && <div className="fixed bottom-4 right-4 rounded-full border bg-card p-3 shadow-lg"><Loader2 className="h-5 w-5 animate-spin" /></div>}
    </div>
  )
}

function VenueEditor({ venue, pending, onSave, el }: { venue: Venue | null; pending: boolean; onSave: (form: { venueId: string | null; name: string; address: string; type: string; distance: number }) => void; el: boolean }) {
  const [name, setName] = useState(venue?.name ?? "")
  const [address, setAddress] = useState(venue?.address ?? "")
  const [type, setType] = useState(venue?.type ?? "study_space")
  const [distance, setDistance] = useState(String(venue?.distance ?? 0))
  return <Card><CardHeader><CardTitle>{venue ? venue.name : (el ? "Νέος χώρος" : "New venue")}</CardTitle><CardDescription>{venue ? (el ? "Ενημέρωση βασικών στοιχείων" : "Update core venue details") : (el ? "Προσθήκη νέου χώρου μελέτης" : "Add a new study venue")}</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Field label={el ? "Όνομα" : "Name"}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field><Field label={el ? "Τύπος" : "Type"}><Input value={type} onChange={(e) => setType(e.target.value)} /></Field><div className="sm:col-span-2"><Field label={el ? "Διεύθυνση" : "Address"}><Input value={address} onChange={(e) => setAddress(e.target.value)} /></Field></div><Field label={el ? "Απόσταση (χλμ.)" : "Distance (km)"}><Input type="number" min="0" max="100" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} /></Field><div className="flex items-end"><Button className="w-full" disabled={pending || name.trim().length < 2} onClick={() => onSave({ venueId: venue?.id ?? null, name, address, type, distance: Number(distance) })}><Save className="h-4 w-4" />{venue ? (el ? "Ενημέρωση" : "Update") : (el ? "Δημιουργία" : "Create")}</Button></div></CardContent></Card>
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) { return <Card><CardContent className="p-4"><Icon className="mb-3 h-5 w-5 text-primary" /><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
function Empty({ text }: { text: string }) { return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p> }
function shortId(id: string) { return id.slice(0, 8) }
const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
