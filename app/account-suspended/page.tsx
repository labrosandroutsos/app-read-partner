import { Ban, LogOut } from "lucide-react"
import { redirect } from "next/navigation"
import { signOut } from "@/lib/actions"
import { getAccessContext } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AccountSuspendedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  const access = await getAccessContext(user.id)
  if (!access.suspension) redirect("/app")

  return <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4"><Card className="w-full max-w-lg"><CardHeader className="text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"><Ban className="h-6 w-6" /></div><CardTitle>Account suspended</CardTitle><CardDescription>This account cannot use Read Partner while the suspension is active.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="rounded-lg border bg-muted/40 p-4"><p className="text-sm font-medium">Reason</p><p className="mt-1 text-sm text-muted-foreground">{access.suspension.reason}</p>{access.suspension.suspended_until && <p className="mt-3 text-xs text-muted-foreground">Scheduled end: {new Date(access.suspension.suspended_until).toLocaleString("en-GB")}</p>}</div><p className="text-xs text-muted-foreground">If you believe this is a mistake, contact the privacy or support address listed in the Privacy Policy.</p><form action={signOut}><Button className="w-full" type="submit" variant="outline"><LogOut className="h-4 w-4" />Log out</Button></form></CardContent></Card></main>
}
