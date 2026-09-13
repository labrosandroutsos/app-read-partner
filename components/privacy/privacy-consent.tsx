"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Analytics } from "@vercel/analytics/next"
import { ShieldCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"
import { createPrivacyConsent, parsePrivacyConsent, PRIVACY_CONSENT_KEY, type PrivacyConsent } from "@/lib/privacy-consent"

export function PrivacyConsentManager() {
  const pathname = usePathname()
  const hasHeaderControl = pathname === "/app" || pathname === "/design-preview"
  const { locale } = useTranslation()
  const el = locale === "el"
  const [ready, setReady] = useState(false)
  const [preferences, setPreferences] = useState<PrivacyConsent | null>(null)
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  useEffect(() => {
    setPreferences(parsePrivacyConsent(window.localStorage.getItem(PRIVACY_CONSENT_KEY)))
    setReady(true)
  }, [])

  useEffect(() => {
    const openPreferences = () => setPreferencesOpen(true)
    window.addEventListener("read-partner:privacy", openPreferences)
    return () => window.removeEventListener("read-partner:privacy", openPreferences)
  }, [])

  const choose = (analytics: boolean) => {
    const wasEnabled = preferences?.analytics === true
    const next = createPrivacyConsent(analytics)
    window.localStorage.setItem(PRIVACY_CONSENT_KEY, JSON.stringify(next))
    setPreferences(next)
    setPreferencesOpen(false)
    // The analytics library injects a script that survives a React unmount.
    // Reload after withdrawal so collection stops immediately.
    if (wasEnabled && !analytics) window.location.reload()
  }

  const panelOpen = ready && (!preferences || preferencesOpen)

  return (
    <>
      {ready && preferences?.analytics && <Analytics />}

      {ready && preferences && !panelOpen && !hasHeaderControl && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="fixed bottom-20 left-3 z-50 rounded-full bg-card/95 shadow-md backdrop-blur md:bottom-4"
          onClick={() => setPreferencesOpen(true)}
        >
          <ShieldCheck className="h-4 w-4" />
          {el ? "Απόρρητο" : "Privacy"}
        </Button>
      )}

      {panelOpen && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="privacy-consent-title"
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border bg-card p-4 shadow-2xl md:p-5"
        >
          {preferences && (
            <Button type="button" variant="ghost" size="icon-sm" className="absolute right-2 top-2" onClick={() => setPreferencesOpen(false)} aria-label={el ? "Κλείσιμο" : "Close"}>
              <X className="h-4 w-4" />
            </Button>
          )}
          <div className="pr-7">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 id="privacy-consent-title" className="font-semibold">{el ? "Επιλογές απορρήτου" : "Privacy choices"}</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {el
                ? "Τα απαραίτητα δεδομένα σύνδεσης λειτουργούν πάντα. Τα ανώνυμα στατιστικά χρήσης ενεργοποιούνται μόνο αν τα αποδεχτείς. Η άρνηση δεν επηρεάζει την εφαρμογή."
                : "Essential sign-in data is always active. Anonymous usage analytics is enabled only if you accept it. Rejecting analytics does not affect the app."}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              <Link href="/privacy" className="underline underline-offset-2">{el ? "Πολιτική απορρήτου" : "Privacy policy"}</Link>
              {" · "}
              <Link href="/cookies" className="underline underline-offset-2">{el ? "Πολιτική cookies" : "Cookie policy"}</Link>
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={() => choose(false)}>{el ? "Απόρριψη στατιστικών" : "Reject analytics"}</Button>
            <Button type="button" variant="outline" className="border-primary text-primary hover:text-primary" onClick={() => choose(true)}>{el ? "Αποδοχή στατιστικών" : "Accept analytics"}</Button>
          </div>
        </section>
      )}
    </>
  )
}
