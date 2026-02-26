"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { NoteCard } from "./note-card"
import { UploadDialog } from "./upload-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { uploadNote, toggleNoteLike } from "@/lib/actions"
import { toast } from "sonner"
import type { Note as DBNote, Subject } from "@/lib/types"

const noteColors = [
  "bg-blue-100 dark:bg-blue-900/30",
  "bg-emerald-100 dark:bg-emerald-900/30",
  "bg-violet-100 dark:bg-violet-900/30",
  "bg-rose-100 dark:bg-rose-900/30",
  "bg-amber-100 dark:bg-amber-900/30",
]

interface NotesScreenProps {
  userId?: string
  notes?: DBNote[]
  subjects?: Subject[]
}

export function NotesScreen({ userId, notes: dbNotes, subjects: dbSubjects }: NotesScreenProps) {
  const { t, locale } = useTranslation()
  const [filterSubject, setFilterSubject] = useState("all")

  const subjectList = dbSubjects ?? []

  const displayNotes = (dbNotes ?? []).map(n => ({
    id: n.id,
    title: n.title,
    subject: n.subject_id?.toString() || '',
    subjectName: (n as any).subject?.name || '',
    subjectNameEn: (n as any).subject?.name_en || '',
    authorName: (n as any).author?.display_name || 'Unknown',
    likes: n.likes_count,
    downloads: n.downloads_count,
    color: noteColors[Math.abs(n.title.length) % noteColors.length],
    liked: n.liked_by_me ?? false,
    noteId: n.id,
  }))

  const filtered = filterSubject === "all"
    ? displayNotes
    : displayNotes.filter(n => n.subject === filterSubject)

  const handleUpload = async (data: { title: string; subject: string }) => {
    try {
      const formData = new FormData()
      formData.set('title', data.title)
      formData.set('subjectId', data.subject)
      await uploadNote(formData)
      toast.success(t("notes.upload.success"))
    } catch {
      toast.error("Upload failed")
    }
  }

  const handleLike = async (noteId: string) => {
    try {
      await toggleNoteLike(noteId)
    } catch {
      // Like toggle failed
    }
  }

  return (
    <div className="relative">
      <div className="px-4 py-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{t("notes.title")}</h2>
      </div>

      <div className="px-4 pb-3">
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("notes.filter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("notes.filter.all")}</SelectItem>
            {subjectList.map((sub) => (
              <SelectItem key={sub.id} value={sub.id.toString()}>
                {locale === "el" ? sub.name : sub.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{t("notes.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("notes.upload")}</p>
        </div>
      ) : (
        <div className="px-4 pb-4 grid grid-cols-2 gap-3">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              locale={locale}
              onLike={() => handleLike(note.noteId)}
            />
          ))}
        </div>
      )}

      <UploadDialog onUpload={handleUpload} subjects={subjectList} />
    </div>
  )
}
