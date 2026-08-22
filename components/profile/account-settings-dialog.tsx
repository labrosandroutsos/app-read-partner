"use client"

import { useState } from "react"
import Link from "next/link"
import { KeyRound, Loader2, UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateProfile } from "@/lib/actions"
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
import type { Profile } from "@/lib/types"

interface AccountSettingsDialogProps {
  email: string
  authProvider: string
  profile: Profile | null
}

export function AccountSettingsDialog({ email, authProvider, profile }: AccountSettingsDialogProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "")
  const [degree, setDegree] = useState(profile?.degree ?? "")
  const [semester, setSemester] = useState(String(profile?.semester ?? 1))

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    const parsedSemester = Number.parseInt(semester, 10)
    if (!displayName.trim() || !Number.isInteger(parsedSemester) || parsedSemester < 1 || parsedSemester > 12) {
      toast.error(t("profile.account.invalid"))
      return
    }

    setSaving(true)
    try {
      await updateProfile({
        displayName: displayName.trim(),
        degree: degree.trim(),
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
            <Input id="account-degree" value={degree} onChange={(event) => setDegree(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="account-semester">{t("profile.account.semester")}</Label>
            <Input id="account-semester" type="number" min="1" max="12" value={semester} onChange={(event) => setSemester(event.target.value)} required />
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
      </DialogContent>
    </Dialog>
  )
}
