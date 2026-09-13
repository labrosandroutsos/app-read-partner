"use client"

import { useEffect, useState, useTransition } from "react"
import { Download, Edit3, EllipsisVertical, Eye, FileText, Flag, Heart, Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { deleteNote, reportNote, toggleNoteLike, updateNote } from "@/lib/actions"
import { toast } from "sonner"
import type { Subject } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface NoteCardData {
  id: string
  authorId: string
  title: string
  subjectId: number | null
  subjectName: string
  subjectNameEn: string
  authorName: string
  likes: number
  downloads: number
  color: string
  liked: boolean
  fileUrl: string | null
}

interface NoteCardProps {
  preview?: boolean
  note: NoteCardData
  currentUserId: string
  subjects: Subject[]
}

export function NoteCard({ preview = false, note, currentUserId, subjects }: NoteCardProps) {
  const { locale } = useTranslation()
  const router = useRouter()
  const [liked, setLiked] = useState(note.liked)
  const [likeCount, setLikeCount] = useState(note.likes)
  const [isPending, startTransition] = useTransition()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [editTitle, setEditTitle] = useState(note.title)
  const [editSubject, setEditSubject] = useState(note.subjectId?.toString() ?? "")
  const [reportReason, setReportReason] = useState("")
  const [reportDetails, setReportDetails] = useState("")

  useEffect(() => {
    setLiked(note.liked)
    setLikeCount(note.likes)
  }, [note.liked, note.likes])

  const handleLike = () => {
    if (isPending) return
    const previousLiked = liked
    const previousCount = likeCount
    setLiked(!previousLiked)
    setLikeCount(Math.max(0, previousCount + (previousLiked ? -1 : 1)))

    startTransition(async () => {
      try {
        const result = await toggleNoteLike(note.id)
        setLiked(result.liked)
        setLikeCount(result.likesCount)
      } catch {
        setLiked(previousLiked)
        setLikeCount(previousCount)
        toast.error(locale === "el" ? "Δεν αποθηκεύτηκε το like." : "The like could not be saved.")
      }
    })
  }

  const subjectName = locale === "el" ? note.subjectName : note.subjectNameEn
  const isOwner = currentUserId === note.authorId
  const el = locale === "el"

  const handleEdit = () => {
    if (!editTitle.trim() || !editSubject || isPending) return
    startTransition(async () => {
      try {
        await updateNote({ noteId: note.id, title: editTitle, subjectId: Number(editSubject) })
        setEditOpen(false)
        router.refresh()
        toast.success(el ? "Οι σημειώσεις ενημερώθηκαν." : "Notes updated.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (el ? "Η ενημέρωση απέτυχε." : "Update failed."))
      }
    })
  }

  const handleDelete = () => {
    if (isPending) return
    startTransition(async () => {
      try {
        await deleteNote(note.id)
        setDeleteOpen(false)
        router.refresh()
        toast.success(el ? "Οι σημειώσεις διαγράφηκαν." : "Notes deleted.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (el ? "Η διαγραφή απέτυχε." : "Delete failed."))
      }
    })
  }

  const handleReport = () => {
    if (!reportReason || isPending) return
    startTransition(async () => {
      try {
        await reportNote(note.id, reportReason, reportDetails)
        setReportOpen(false)
        setReportReason("")
        setReportDetails("")
        toast.success(el ? "Η αναφορά υποβλήθηκε." : "Report submitted.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : (el ? "Η αναφορά απέτυχε." : "Report failed."))
      }
    })
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
      {/* Thumbnail */}
      <div className={cn("relative h-14", note.color)}>
        {note.fileUrl ? (
          <button type="button" onClick={() => setPreviewOpen(true)} className="flex h-full w-full items-center justify-center hover:bg-black/5" aria-label={el ? "Προεπισκόπηση σημειώσεων" : "Preview notes"}>
            <FileText className="h-6 w-6 text-primary" />
            <span className="absolute bottom-2 right-2 rounded-full bg-background/90 p-1.5 shadow"><Eye className="h-3.5 w-3.5" /></span>
          </button>
        ) : (
          <div className="flex h-full items-center justify-center"><FileText className="h-6 w-6 text-primary" /></div>
        )}
        <div className="absolute right-1 top-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" disabled={preview} className="h-11 w-11 bg-transparent" aria-label={el ? "Επιλογές σημειώσεων" : "Note options"}>
                <EllipsisVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner ? (
                <>
                  <DropdownMenuItem onSelect={() => setEditOpen(true)}><Edit3 />{el ? "Επεξεργασία" : "Edit"}</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}><Trash2 />{el ? "Διαγραφή" : "Delete"}</DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onSelect={() => setReportOpen(true)}><Flag />{el ? "Αναφορά" : "Report"}</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1.5">
        <h2 className="font-semibold text-base leading-snug text-foreground">{note.title}</h2>
        {subjectName && (
          <p className="text-xs text-muted-foreground">
            {subjectName}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{note.authorName}</p>

        {/* Actions */}
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/50">
          <button
            onClick={handleLike}
            disabled={isPending || preview}
            aria-pressed={liked}
            className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label={el ? "Μου αρέσει" : "Like"}
          >
            <Heart className={cn("h-3.5 w-3.5", liked && "fill-red-500 text-red-500")} />
            <span>{likeCount}</span>
          </button>
          <a
            href={note.fileUrl ? `/api/notes/${note.id}/download` : undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!note.fileUrl}
            title={note.fileUrl
              ? (locale === "el" ? "Λήψη αρχείου" : "Download file")
              : (locale === "el" ? "Δεν υπάρχει διαθέσιμο αρχείο" : "No file is available")}
            onClick={(event) => {
              if (!note.fileUrl) event.preventDefault()
            }}
            className={cn(
              "flex min-h-11 items-center gap-2 text-sm transition-colors",
              note.fileUrl ? "text-muted-foreground hover:text-foreground" : "cursor-not-allowed text-muted-foreground/40",
            )}
            aria-label={locale === "el" ? "Λήψη σημειώσεων" : "Download notes"}
          >
            <Download className="h-3.5 w-3.5" />
            <span>{el ? "Λήψη" : "Download"}</span>
          </a>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="h-[82dvh] max-w-[min(94vw,760px)] p-3">
          <DialogHeader className="pr-8">
            <DialogTitle className="truncate">{note.title}</DialogTitle>
            <DialogDescription>{el ? "Προεπισκόπηση αρχείου" : "File preview"}</DialogDescription>
          </DialogHeader>
          <iframe title={note.title} src={`/api/notes/${note.id}/preview`} className="h-full min-h-0 w-full rounded-md border bg-white" />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => !isPending && setEditOpen(open)}>
        <DialogContent className="max-w-[390px]">
          <DialogHeader><DialogTitle>{el ? "Επεξεργασία σημειώσεων" : "Edit notes"}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2"><Label htmlFor={`edit-note-${note.id}`}>{el ? "Τίτλος" : "Title"}</Label><Input id={`edit-note-${note.id}`} maxLength={160} value={editTitle} onChange={(event) => setEditTitle(event.target.value)} /></div>
            <div className="flex flex-col gap-2">
              <Label>{el ? "Μάθημα" : "Subject"}</Label>
              <Select value={editSubject} onValueChange={setEditSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{subjects.map((subject) => <SelectItem key={subject.id} value={String(subject.id)}>{el ? subject.name : subject.name_en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleEdit} disabled={!editTitle.trim() || !editSubject || isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin" />}{el ? "Αποθήκευση" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={(open) => !isPending && setDeleteOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{el ? "Διαγραφή σημειώσεων;" : "Delete notes?"}</AlertDialogTitle><AlertDialogDescription>{el ? "Το αρχείο και όλα τα likes θα διαγραφούν οριστικά." : "The file and all likes will be permanently deleted."}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{el ? "Ακύρωση" : "Cancel"}</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">{isPending && <Loader2 className="h-4 w-4 animate-spin" />}{el ? "Διαγραφή" : "Delete"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={reportOpen} onOpenChange={(open) => !isPending && setReportOpen(open)}>
        <DialogContent className="max-w-[390px]">
          <DialogHeader><DialogTitle>{el ? "Αναφορά σημειώσεων" : "Report notes"}</DialogTitle><DialogDescription>{el ? "Ανάφερε ακατάλληλο, επικίνδυνο ή κλεμμένο περιεχόμενο." : "Report inappropriate, unsafe, or copyrighted content."}</DialogDescription></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2"><Label>{el ? "Λόγος" : "Reason"}</Label><Select value={reportReason} onValueChange={setReportReason}><SelectTrigger><SelectValue placeholder={el ? "Επίλεξε λόγο" : "Select a reason"} /></SelectTrigger><SelectContent><SelectItem value="spam">Spam</SelectItem><SelectItem value="harassment">{el ? "Παρενόχληση" : "Harassment"}</SelectItem><SelectItem value="unsafe">{el ? "Επικίνδυνο περιεχόμενο" : "Unsafe content"}</SelectItem><SelectItem value="copyright">Copyright</SelectItem><SelectItem value="other">{el ? "Άλλο" : "Other"}</SelectItem></SelectContent></Select></div>
            <div className="flex flex-col gap-2"><Label htmlFor={`report-note-${note.id}`}>{el ? "Λεπτομέρειες (προαιρετικά)" : "Details (optional)"}</Label><Textarea id={`report-note-${note.id}`} maxLength={500} value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleReport} disabled={!reportReason || isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin" />}{el ? "Υποβολή" : "Submit"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
