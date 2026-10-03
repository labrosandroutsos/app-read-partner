import { isCatalogueReady, getCurriculumSubjects, isGeneralStudyReady } from '@/lib/academic-data'
import { AcademicSetup } from '@/components/academics/academic-setup'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProfile, getSubjects, getVenues, getConversations, getNotes, getCoupons, getStudySessions, getStudyStats, getPastPartners, getBlockedUsers, getActiveVenueCheckin, getVenueManagerAssignment, getAccessContext, getNotifications } from '@/lib/data'
import { AppShellClient } from '@/components/app-shell-client'

export default async function AppPage({ searchParams }: { searchParams: Promise<{ catalogue?: string }> }) {
  const { catalogue } = await searchParams
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

  const profile = await getProfile(user.id)
  const catalogueReady = await isCatalogueReady()
  if (catalogueReady && !profile?.department_id && catalogue !== 'later') return <AcademicSetup profile={profile} />

  const [subjects, venues, conversations, notes, coupons, studySessions, studyStats, pastPartners, blockedUsers, activeVenueId, notifications] = await Promise.all([
    profile?.curriculum_id ? getCurriculumSubjects(profile.curriculum_id) : profile?.department_id ? Promise.resolve([]) : getSubjects().then(items => items.filter(subject => !subject.department_id)),
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

  const generalStudyAvailable = Boolean(profile?.department_id) && await isGeneralStudyReady()
  return (
    <AppShellClient
      generalStudyAvailable={generalStudyAvailable}
      userId={user.id}
      email={user.email ?? ''}
      authProvider={typeof user.app_metadata.provider === 'string' ? user.app_metadata.provider : 'email'}
      profile={profile}
      subjects={subjects}
      venues={venues}
      conversations={conversations}
      notes={profile?.department_id ? notes.filter(n => subjects.some(s => s.id === n.subject_id)) : notes}
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
