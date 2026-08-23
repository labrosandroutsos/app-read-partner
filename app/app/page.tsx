import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProfile, getSubjects, getVenues, getConversations, getNotes, getCoupons, getStudySessions, getStudyStats, getPastPartners } from '@/lib/data'
import { AppShellClient } from '@/components/app-shell-client'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const [profile, subjects, venues, conversations, notes, coupons, studySessions, studyStats, pastPartners] = await Promise.all([
    getProfile(user.id),
    getSubjects(),
    getVenues(),
    getConversations(user.id),
    getNotes(user.id),
    getCoupons(user.id),
    getStudySessions(user.id),
    getStudyStats(user.id),
    getPastPartners(user.id),
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
    />
  )
}
