import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProfile, getSubjects, getVenues, getConversations, getNotes, getCoupons, getStudySessions, getStudyStats, getPastPartners, getBlockedUsers, getActiveVenueCheckin, getVenueManagerAssignment, getAccessContext, getNotifications } from '@/lib/data'
import { AppShellClient } from '@/components/app-shell-client'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const access = await getAccessContext(user.id)
  if (access.suspension) redirect('/account-suspended')
  if (access.role === 'admin') redirect('/admin')
  if (access.role === 'moderator') redirect('/moderator')

  const managerAssignment = await getVenueManagerAssignment(user.id)
  if (managerAssignment) redirect('/venue-manager')

  const [profile, subjects, venues, conversations, notes, coupons, studySessions, studyStats, pastPartners, blockedUsers, activeVenueId, notifications] = await Promise.all([
    getProfile(user.id),
    getSubjects(),
    getVenues(),
    getConversations(user.id),
    getNotes(user.id),
    getCoupons(user.id),
    getStudySessions(user.id),
    getStudyStats(user.id),
    getPastPartners(user.id),
    getBlockedUsers(user.id),
    getActiveVenueCheckin(user.id),
    getNotifications(user.id),
  ])

  return (
    <AppShellClient
      userId={user.id}
      email={user.email ?? ''}
      authProvider={typeof user.app_metadata.provider === 'string' ? user.app_metadata.provider : 'email'}
      profile={profile}
      subjects={subjects}
      venues={venues}
      conversations={conversations}
      notes={notes}
      coupons={coupons}
      studySessions={studySessions}
      studyStats={studyStats}
      pastPartners={pastPartners}
      blockedUsers={blockedUsers}
      activeVenueId={activeVenueId}
      notifications={notifications}
    />
  )
}
