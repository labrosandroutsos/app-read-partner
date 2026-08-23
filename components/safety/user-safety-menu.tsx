"use client"

import { useState, useTransition } from "react"
import { Ban, EllipsisVertical, Flag, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { blockUser, reportUser } from "@/lib/actions"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface UserSafetyMenuProps {
  targetUserId: string
  targetName: string
  onBlocked?: () => void
}

export function UserSafetyMenu({ targetUserId, targetName, onBlocked }: UserSafetyMenuProps) {
  const { locale } = useTranslation()
  const router = useRouter()
  const [reportOpen, setReportOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")
  const [isPending, startTransition] = useTransition()
  const el = locale === "el"

  const submitReport = () => {
    if (!reason || isPending) return
    startTransition(async () => {
      try {
        await reportUser(targetUserId, reason, details)
        setReportOpen(false)
        setReason("")
        setDetails("")
        toast.success(el ? "Η αναφορά υποβλήθηκε." : "Report submitted.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (el ? "Η αναφορά απέτυχε." : "Report failed."))
      }
    })
  }

  const confirmBlock = () => {
    if (isPending) return
    startTransition(async () => {
      try {
        await blockUser(targetUserId)
        setBlockOpen(false)
        onBlocked?.()
        router.refresh()
        toast.success(el ? "Ο χρήστης αποκλείστηκε." : "User blocked.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (el ? "Ο αποκλεισμός απέτυχε." : "Block failed."))
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={el ? "Επιλογές ασφάλειας" : "Safety options"}>
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setReportOpen(true)}>
            <Flag /> {el ? "Αναφορά χρήστη" : "Report user"}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setBlockOpen(true)}>
            <Ban /> {el ? "Αποκλεισμός" : "Block user"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={reportOpen} onOpenChange={(open) => !isPending && setReportOpen(open)}>
        <DialogContent className="max-w-[390px]">
          <DialogHeader>
            <DialogTitle>{el ? `Αναφορά: ${targetName}` : `Report ${targetName}`}</DialogTitle>
            <DialogDescription>{el ? "Η αναφορά θα εξεταστεί από τους διαχειριστές." : "The report will be reviewed by moderators."}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>{el ? "Λόγος" : "Reason"}</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue placeholder={el ? "Επίλεξε λόγο" : "Select a reason"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">{el ? "Παρενόχληση" : "Harassment"}</SelectItem>
                  <SelectItem value="unsafe">{el ? "Επικίνδυνη συμπεριφορά" : "Unsafe behaviour"}</SelectItem>
                  <SelectItem value="impersonation">{el ? "Πλαστοπροσωπία" : "Impersonation"}</SelectItem>
                  <SelectItem value="other">{el ? "Άλλο" : "Other"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`user-report-${targetUserId}`}>{el ? "Λεπτομέρειες (προαιρετικά)" : "Details (optional)"}</Label>
              <Textarea id={`user-report-${targetUserId}`} maxLength={500} value={details} onChange={(event) => setDetails(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitReport} disabled={!reason || isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {el ? "Υποβολή" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={blockOpen} onOpenChange={(open) => !isPending && setBlockOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{el ? `Αποκλεισμός ${targetName};` : `Block ${targetName}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {el ? "Δεν θα βλέπετε ο ένας τον άλλο και δεν θα μπορείτε να ανταλλάξετε μηνύματα." : "You will no longer see each other or be able to exchange messages."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{el ? "Ακύρωση" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBlock} className="bg-destructive text-white hover:bg-destructive/90">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {el ? "Αποκλεισμός" : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
