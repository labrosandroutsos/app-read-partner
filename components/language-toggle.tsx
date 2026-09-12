"use client"

import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(locale === "el" ? "en" : "el")}
      className="text-xs font-semibold px-3 h-11 min-w-11 rounded-full"
      aria-label={locale === "el" ? "Switch to English" : "Αλλαγή σε Ελληνικά"}
    >
      {locale === "el" ? "EN" : "EL"}
    </Button>
  )
}
