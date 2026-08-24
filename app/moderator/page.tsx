import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { ModerationDashboard } from "@/components/admin/moderation-dashboard"
import { getAccessContext, getModerationDashboard } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function ModeratorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  const access = await getAccessContext(user.id)
  if (access.suspension) redirect("/account-suspended")
  if (!access.role) redirect("/app")
  const dashboard = await getModerationDashboard(user.id)
  if (!dashboard) redirect("/app")

  return <div className="min-h-dvh bg-muted/30"><AdminHeader email={user.email ?? ""} role={access.role} /><main className="mx-auto max-w-7xl px-4 py-6"><div className="mb-6"><h1 className="text-3xl font-bold">Moderation queue</h1><p className="mt-1 text-sm text-muted-foreground">Review reports, protect users, and keep every decision auditable.</p></div><ModerationDashboard data={dashboard} /></main></div>
}
