"use client"

import { SemesterSelect } from '@/components/academics/semester-select'
import { filterCourses } from '@/lib/academic-catalogue'
import { useState } from "react"
import { ScreenHeading } from "@/components/screen-heading"
import { FileText } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { NoteCard } from "./note-card"
import { UploadDialog } from "./upload-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Note as DBNote, Subject } from "@/lib/types"

interface NotesScreenProps {
  preview?: boolean
  userId?: string
  notes?: DBNote[]
  subjects?: Subject[]
}

export function NotesScreen({ preview = false, userId = "", notes: dbNotes = [], subjects: dbSubjects = [] }: NotesScreenProps) {
  const { t, locale } = useTranslation()
  const [filterSubject, setFilterSubject] = useState("all")
  const [semester, setSemester] = useState("all")
  const subjectList = filterCourses(dbSubjects, semester)

  // Build display items
  const displayNotes = dbNotes.map(n => ({
        id: n.id,
        authorId: n.author_id,
        title: n.title,
        subjectId: n.subject_id,
        subject: n.subject_id?.toString() || '',
        subjectName: (n as any).subject?.name || '',
        subjectNameEn: (n as any).subject?.name_en || '',
        authorName: (n as any).author?.display_name || 'Unknown',
        likes: n.likes_count,
        downloads: n.downloads_count,
        color: "bg-secondary",
        liked: n.liked_by_me ?? false,
        fileUrl: n.file_url,
      }))

  const filtered = displayNotes.filter(n => (semester === "all" || subjectList.some(s => s.id === n.subjectId)) && (filterSubject === "all" || n.subject === filterSubject))

  return (
    <div className="relative">
      <ScreenHeading title={t("notes.title")} description={locale === "el" ? "Κράτα ό,τι σε βοηθά. Μοιράσου ό,τι ξέρεις." : "Keep what helps. Share what you know."} />
      <div className="px-5 pb-5">{preview ? <p className="text-xs text-muted-foreground">{locale === "el" ? "Δείγμα βιβλιοθήκης · οι ενέργειες είναι ανενεργές" : "Sample library · actions are disabled"}</p> : dbSubjects.length ? <UploadDialog subjects={dbSubjects} /> : <p className="text-sm text-muted-foreground">{locale === "el" ? "Ο κατάλογος του προγράμματός σου δεν είναι ακόμη διαθέσιμος. Μπορείς να βρεις παρέα για γενικό διάβασμα από την καρτέλα Partner." : "Your programme’s catalogue is not available yet. You can find company for general studying in the Partner tab."}</p>}</div>
      <div className="px-5 pb-5">
        {dbSubjects.some(s => s.offerings) && <SemesterSelect value={semester} onChange={value => {setSemester(value); setFilterSubject("all")}} />}
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger aria-label={t("notes.filter")} className="data-[size=default]:h-12 w-full bg-card">
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

      <div className="px-5 pb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map((note) => (
          <NoteCard preview={preview} key={note.id} note={note} currentUserId={userId} subjects={subjectList} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mx-5 border-t border-border py-8">
          <FileText className="mb-4 h-7 w-7 text-muted-foreground" />
          <p className="font-medium text-foreground">{t("notes.empty")}</p>
          {dbSubjects.length > 0 && <p className="mt-1 text-sm text-muted-foreground">{t("notes.empty.help")}</p>}
        </div>
      )}

    </div>
  )
}
