"use client"

import { useState } from "react"
import Link from "next/link"
import { KeyRound, Loader2, ShieldOff, UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { unblockUser, updateProfile } from "@/lib/actions"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { BlockedUser, Profile } from "@/lib/types"

interface AccountSettingsDialogProps {
  email: string
  authProvider: string
  profile: Profile | null
  blockedUsers: BlockedUser[]
}

export function AccountSettingsDialog({ email, authProvider, profile, blockedUsers }: AccountSettingsDialogProps) {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "")
  const [degree, setDegree] = useState(profile?.degree ?? "")
  const [semester, setSemester] = useState(String(profile?.semester ?? 1))
  const [unblockingId, setUnblockingId] = useState<string | null>(null)

  async function handleUnblock(userId: string) {
    setUnblockingId(userId)
    try {
      await unblockUser(userId)
      toast.success(locale === "el" ? "Ο αποκλεισμός αφαιρέθηκε." : "User unblocked.")
      router.refresh()
    } catch {
      toast.error(locale === "el" ? "Δεν ήταν δυνατή η άρση αποκλεισμού." : "Unable to unblock user.")
    } finally {
      setUnblockingId(null)
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    const parsedSemester = Number.parseInt(semester, 10)
    if (!displayName.trim() || !Number.isInteger(parsedSemester) || parsedSemester < 1 || parsedSemester > 13) {
      toast.error(t("profile.account.invalid"))
      return
    }

    setSaving(true)
    try {
      await updateProfile({
        displayName: displayName.trim(),
        ...(profile?.department_id ? {} : {degree: degree.trim()}),
        semester: parsedSemester,
      })
      toast.success(t("profile.account.saved"))
      setOpen(false)
      router.refresh()
    } catch {
      toast.error(t("profile.account.error"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <UserRound className="h-4 w-4" />
          {t("profile.account.manage")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[390px]">
        <DialogHeader>
          <DialogTitle>{t("profile.account.title")}</DialogTitle>
          <DialogDescription>{t("profile.account.description")}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <p className="font-medium break-all">{email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("profile.account.connectedWith")}: {authProvider === "google" ? "Google" : t("profile.account.emailPassword")}
          </p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="account-display-name">{t("profile.account.name")}</Label>
            <Input id="account-display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="account-degree">{t("profile.account.degree")}</Label>
            <Input disabled={Boolean(profile?.department_id)} id="account-degree" value={degree} onChange={(event) => setDegree(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="account-semester">{t("profile.account.semester")}</Label>
            <Input id="account-semester" type="number" min="1" max="13" value={semester} onChange={(event) => setSemester(event.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? t("profile.account.saving") : t("profile.account.save")}
            </Button>
          </DialogFooter>
        </form>

        <Separator />
        <Button variant="outline" asChild>
          <Link href="/auth/update-password">
            <KeyRound className="h-4 w-4" />
            {t("profile.account.changePassword")}
          </Link>
        </Button>

        <Separator />
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldOff className="h-4 w-4" />
            {locale === "el" ? "Αποκλεισμένοι χρήστες" : "Blocked users"}
          </div>
          {blockedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{locale === "el" ? "Δεν έχεις αποκλείσει κανέναν." : "You have not blocked anyone."}</p>
          ) : blockedUsers.map((blocked) => (
            <div key={blocked.id} className="flex items-center justify-between rounded-lg border p-2">
              <span className="truncate text-sm">{blocked.display_name || "Student"}</span>
              <Button type="button" variant="outline" size="sm" disabled={unblockingId === blocked.id} onClick={() => handleUnblock(blocked.id)}>
                {unblockingId === blocked.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {locale === "el" ? "Άρση" : "Unblock"}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
