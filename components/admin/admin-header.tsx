"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, LogOut, ShieldCheck } from "lucide-react"
import { signOut } from "@/lib/actions"
import { LanguageToggle } from "@/components/language-toggle"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

export function AdminHeader({ email, role }: { email: string; role: "moderator" | "admin" }) {
  const { locale } = useTranslation()
  const pathname = usePathname()
  const el = locale === "el"
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            {role === "admin" ? <ShieldCheck className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold">Read Partner · {role === "admin" ? (el ? "Διαχείριση" : "Administration") : (el ? "Συντονισμός" : "Moderation")}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {role === "admin" && <Button asChild variant="ghost" size="sm"><Link href={pathname.startsWith("/moderator") ? "/admin" : "/moderator"}>{pathname.startsWith("/moderator") ? (el ? "Διαχείριση" : "Administration") : (el ? "Ουρά αναφορών" : "Report queue")}</Link></Button>}
          <LanguageToggle />
          <form action={signOut}><Button type="submit" variant="outline" size="sm"><LogOut className="h-4 w-4" />{el ? "Έξοδος" : "Log out"}</Button></form>
        </div>
      </div>
    </header>
  )
}
