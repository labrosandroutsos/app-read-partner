"use client"

import { useRef, useState, useTransition } from "react"
import { FileCheck2, Loader2, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { uploadNote } from "@/lib/actions"
import type { Subject } from "@/lib/types"

interface UploadDialogProps {
  subjects?: Subject[]
}

export function UploadDialog({ subjects }: UploadDialogProps) {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()

  const subjectList = subjects || []

  const resetForm = () => {
    setTitle("")
    setSubject("")
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = () => {
    if (!title.trim() || !subject || !file || isPending) return

    const formData = new FormData()
    formData.set("title", title.trim())
    formData.set("subjectId", subject)
    formData.set("file", file)

    startTransition(async () => {
      try {
        await uploadNote(formData)
        resetForm()
        setOpen(false)
        router.refresh()
        toast.success(t("notes.upload.success"))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("notes.upload.error"))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isPending && setOpen(nextOpen)}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-24 right-[max(1rem,calc((100vw-760px)/2+1rem))] z-30 h-14 w-14 rounded-full shadow-lg"
          aria-label={t("notes.upload")}
        >
          <Upload className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[380px] mx-auto">
        <DialogHeader>
          <DialogTitle>{t("notes.upload.title")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="note-title">{t("notes.upload.name")}</Label>
            <Input
              id="note-title"
              placeholder={t("notes.upload.name.placeholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("notes.upload.subject")}</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder={t("partner.wizard.subject.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {subjectList.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id.toString()}>
                    {locale === "el" ? sub.name : sub.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="note-file">{t("notes.upload.file")}</Label>
            <input
              ref={fileInputRef}
              id="note-file"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {file ? (
                <>
                  <FileCheck2 className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <p className="break-all text-sm font-medium text-foreground">{file.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t("notes.upload.file.placeholder")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG, WEBP · 10 MB max</p>
                </>
              )}
            </button>
          </div>
          <Button onClick={handleSubmit} disabled={!title.trim() || !subject || !file || isPending} className="w-full">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? t("notes.upload.uploading") : t("notes.upload.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
