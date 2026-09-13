"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { BookOpen, Moon, ShieldCheck, Sun } from "lucide-react"
import { LanguageToggle } from "@/components/language-toggle"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

export function StudyHeader() {
  const { locale } = useTranslation()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return <header className="z-40 flex shrink-0 items-center justify-between border-b border-border bg-background px-5 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
    <span className="flex items-center gap-2 text-sm font-semibold tracking-tight"><BookOpen className="h-5 w-5 text-primary" />Read Partner</span>
    <div className="flex items-center">
      <LanguageToggle />
      <Button variant="ghost" size="icon" aria-label={locale === "el" ? "Αλλαγή εμφάνισης" : "Toggle theme"} onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{mounted && resolvedTheme === "dark" ? <Sun /> : <Moon />}</Button>
      <Button variant="ghost" size="icon" aria-label={locale === "el" ? "Επιλογές απορρήτου" : "Privacy choices"} onClick={() => window.dispatchEvent(new Event("read-partner:privacy"))}><ShieldCheck /></Button>
    </div>
  </header>
}
