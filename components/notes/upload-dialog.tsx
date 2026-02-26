"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { Subject } from "@/lib/types"

interface UploadDialogProps {
  onUpload: (note: { title: string; subject: string }) => void
  subjects?: Subject[]
}

export function UploadDialog({ onUpload, subjects }: UploadDialogProps) {
  const { t, locale } = useTranslation()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")

  const subjectList = subjects || []

  const handleSubmit = () => {
    if (!title.trim() || !subject) return
    onUpload({ title: title.trim(), subject })
    setTitle("")
    setSubject("")
    setOpen(false)
    toast.success(t("notes.upload.success"))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-24 right-[calc(50%-200px+16px)] z-30 h-14 w-14 rounded-full shadow-lg"
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
            <Label>{t("notes.upload.file")}</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{t("notes.upload.file.placeholder")}</p>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={!title.trim() || !subject} className="w-full">
            {t("notes.upload.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
