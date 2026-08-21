"use client"

import { useState } from "react"
import { Heart, Download, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Note } from "@/lib/mock-data"
import { getSubjectById } from "@/lib/mock-data"
import { useTranslation } from "@/lib/i18n"

interface NoteCardProps {
  note: Note
}

export function NoteCard({ note }: NoteCardProps) {
  const { locale } = useTranslation()
  const [liked, setLiked] = useState(note.liked ?? false)
  const [likeCount, setLikeCount] = useState(note.likes)
  const subject = getSubjectById(note.subject)

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className={cn("h-28 flex items-center justify-center", note.color)}>
        <FileText className="h-10 w-10 text-muted-foreground/40" />
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5">
        <h4 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">{note.title}</h4>
        {subject && (
          <p className="text-xs text-muted-foreground">
            {locale === "el" ? subject.name : subject.nameEn}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{note.authorName}</p>

        {/* Actions */}
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
