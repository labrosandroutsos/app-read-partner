import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { AdminHeader } from "@/components/admin/admin-header"
import { getAccessContext, getAdminDashboard } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  const access = await getAccessContext(user.id)
  if (access.suspension) redirect("/account-suspended")
  if (access.role !== "admin") redirect(access.role === "moderator" ? "/moderator" : "/app")
  const dashboard = await getAdminDashboard(user.id)
  if (!dashboard) redirect("/app")

  return <div className="min-h-dvh bg-muted/30"><AdminHeader email={user.email ?? ""} role="admin" /><main className="mx-auto max-w-7xl px-4 py-6"><div className="mb-6"><h1 className="text-3xl font-bold">Administration</h1><p className="mt-1 text-sm text-muted-foreground">Roles, venues, moderation settings, and a permanent action history.</p></div><AdminDashboard data={dashboard} currentUserId={user.id} /></main></div>
}
