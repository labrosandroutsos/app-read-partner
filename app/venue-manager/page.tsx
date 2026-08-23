import { redirect } from "next/navigation"
import { VenueManagerDashboard } from "@/components/venue-manager/venue-manager-dashboard"
import { getVenueManagerDashboard } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function VenueManagerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const dashboard = await getVenueManagerDashboard(user.id)
  if (!dashboard) redirect("/app")

  return <VenueManagerDashboard email={user.email ?? ""} data={dashboard} />
}
