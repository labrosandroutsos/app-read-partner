"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { NoteCard } from "./note-card"
import { UploadDialog } from "./upload-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Note as DBNote, Subject } from "@/lib/types"

interface NotesScreenProps {
  userId?: string
  notes?: DBNote[]
  subjects?: Subject[]
}

const noteColors = [
  "bg-blue-100 dark:bg-blue-900/30",
  "bg-emerald-100 dark:bg-emerald-900/30",
  "bg-violet-100 dark:bg-violet-900/30",
  "bg-rose-100 dark:bg-rose-900/30",
  "bg-amber-100 dark:bg-amber-900/30",
]

export function NotesScreen({ notes: dbNotes = [], subjects: dbSubjects = [] }: NotesScreenProps) {
  const { t, locale } = useTranslation()
  const [filterSubject, setFilterSubject] = useState("all")
  const subjectList = dbSubjects

  // Build display items
  const displayNotes = dbNotes.map(n => ({
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
        fileUrl: n.file_url,
      }))

  const filtered = filterSubject === "all"
    ? displayNotes
    : displayNotes.filter(n => n.subject === filterSubject)

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

      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
        {filtered.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mx-4 mt-6 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <FileText className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
          <p className="font-medium text-foreground">{t("notes.empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("notes.empty.help")}</p>
        </div>
      )}

      <UploadDialog subjects={subjectList} />
    </div>
  )
}
