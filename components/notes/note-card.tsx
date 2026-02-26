"use client"

import { useState } from "react"
import { Heart, Download, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface NoteDisplay {
  id: string
  title: string
  subject: string
  subjectName: string
  subjectNameEn: string
  authorName: string
  likes: number
  downloads: number
  color: string
  liked: boolean
  noteId: string
}

interface NoteCardProps {
  note: NoteDisplay
  locale?: string
  onLike?: () => void
}

export function NoteCard({ note, locale, onLike }: NoteCardProps) {
  const [liked, setLiked] = useState(note.liked)
  const [likeCount, setLikeCount] = useState(note.likes)

  const subjectDisplay = locale === "el" ? note.subjectName : (note.subjectNameEn || note.subjectName)

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
    onLike?.()
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
      <div className={cn("h-28 flex items-center justify-center", note.color)}>
        <FileText className="h-10 w-10 text-muted-foreground/40" />
      </div>

      <div className="p-3 flex flex-col gap-1.5">
        <h4 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">{note.title}</h4>
        {subjectDisplay && (
          <p className="text-xs text-muted-foreground">{subjectDisplay}</p>
        )}
        <p className="text-xs text-muted-foreground">{note.authorName}</p>

        <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/50">
          <button
            onClick={handleLike}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Like"
          >
            <Heart className={cn("h-3.5 w-3.5", liked && "fill-red-500 text-red-500")} />
            <span>{likeCount}</span>
          </button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Download className="h-3.5 w-3.5" />
            <span>{note.downloads}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
