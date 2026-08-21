"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n"
import { NoteCard } from "./note-card"
import { UploadDialog } from "./upload-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { notes as mockNotes, subjects as mockSubjects, currentUser } from "@/lib/mock-data"
import type { Note as MockNote } from "@/lib/mock-data"
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

export function NotesScreen({ userId, notes: dbNotes, subjects: dbSubjects }: NotesScreenProps) {
  const { t, locale } = useTranslation()
  const [filterSubject, setFilterSubject] = useState("all")
  const [localNotes, setLocalNotes] = useState<MockNote[]>(mockNotes)

  const hasDBNotes = dbNotes && dbNotes.length > 0
  const subjectList = dbSubjects && dbSubjects.length > 0
    ? dbSubjects
    : mockSubjects.map((s, i) => ({ id: i + 1, name: s.name, name_en: s.nameEn, faculty: s.faculty }))

  // Build display items
  const displayNotes = hasDBNotes
    ? dbNotes.map(n => ({
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
    : localNotes.map(n => ({
        id: n.id,
        title: n.title,
        subject: n.subject,
        subjectName: '',
        subjectNameEn: '',
        authorName: n.authorName,
        likes: n.likes,
        downloads: n.downloads,
        color: n.color,
        liked: n.liked ?? false,
        noteId: n.id,
      }))

  const filtered = filterSubject === "all"
    ? displayNotes
    : displayNotes.filter(n => n.subject === filterSubject)

  const handleUpload = (data: { title: string; subject: string }) => {
    const newNote: MockNote = {
      id: `n-${Date.now()}`,
      title: data.title,
      subject: data.subject,
      authorId: currentUser.id,
      authorName: currentUser.name.split(" ")[0] + " " + (currentUser.name.split(" ")[1]?.[0] || "") + ".",
      likes: 0,
      downloads: 0,
      color: noteColors[Math.floor(Math.random() * noteColors.length)],
    }
    setLocalNotes((prev) => [newNote, ...prev])
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

      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
        {filtered.map((note) => (
          <NoteCard key={note.id} note={note as any} />
        ))}
      </div>

      <UploadDialog onUpload={handleUpload} subjects={subjectList} />
    </div>
  )
}
