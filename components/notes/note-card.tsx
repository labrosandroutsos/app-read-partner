"use client"

import { useEffect, useState, useTransition } from "react"
import { Heart, Download, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { toggleNoteLike } from "@/lib/actions"
import { toast } from "sonner"

interface NoteCardData {
  id: string
  title: string
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
  note: NoteCardData
}

export function NoteCard({ note }: NoteCardProps) {
  const { locale } = useTranslation()
  const [liked, setLiked] = useState(note.liked)
  const [likeCount, setLikeCount] = useState(note.likes)
  const [isPending, startTransition] = useTransition()

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

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className={cn("h-28 flex items-center justify-center", note.color)}>
        <FileText className="h-10 w-10 text-muted-foreground/40" />
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5">
        <h4 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">{note.title}</h4>
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
            disabled={isPending}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Like"
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
              "flex items-center gap-1 text-xs transition-colors",
              note.fileUrl ? "text-muted-foreground hover:text-foreground" : "cursor-not-allowed text-muted-foreground/40",
            )}
            aria-label={locale === "el" ? "Λήψη σημειώσεων" : "Download notes"}
          >
            <Download className="h-3.5 w-3.5" />
            <span>{note.downloads}</span>
          </a>
        </div>
      </div>
    </div>
  )
}
