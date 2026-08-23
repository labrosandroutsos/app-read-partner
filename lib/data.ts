import { createClient } from '@/lib/supabase/server'
import type {
  Profile, Subject, Venue, Match, Message, Note, Coupon,
  StudySessionRecord, ConversationPreview, BlockedUser, VenueManagerDashboardData
} from '@/lib/types'

async function getBlockedUserIdSet(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)

  return new Set((data ?? []).map((row) => row.blocker_id === userId ? row.blocked_id : row.blocker_id))
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export async function getSubjects(): Promise<Subject[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('subjects').select('*').order('id')
  return data ?? []
}

export async function getVenues(): Promise<Venue[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('venues').select('*').order('distance')
  return data ?? []
}

export async function getActiveVenueCheckin(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('venue_checkins')
    .select('venue_id')
    .eq('user_id', userId)
    .is('checked_out_at', null)
    .maybeSingle()
  return data?.venue_id ?? null
}

export async function getVenueManagerAssignment(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('venue_managers')
    .select('id, venue_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data ?? null
}

export async function getVenueManagerDashboard(userId: string): Promise<VenueManagerDashboardData | null> {
  const supabase = await createClient()
  const { data: assignment } = await supabase
    .from('venue_managers')
    .select('id, venue_id, venue:venue_id(*)')
    .eq('user_id', userId)
    .maybeSingle()

  const joinedVenue = assignment?.venue
  const venue = (Array.isArray(joinedVenue) ? joinedVenue[0] : joinedVenue) as Venue | null | undefined
  if (!assignment || !venue) return null

  const [{ count: activeCheckins }, { data: upcomingSessions }, { data: recentCheckins }, { data: occupancyHistory }] = await Promise.all([
    supabase
      .from('venue_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', assignment.venue_id)
      .is('checked_out_at', null),
    supabase
      .from('study_sessions')
      .select('id, starts_at, ends_at, status, duration_hours')
      .eq('venue_id', assignment.venue_id)
      .in('status', ['proposed', 'confirmed'])
      .gte('ends_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(12),
    supabase
      .from('venue_checkins')
      .select('id, checked_in_at, checked_out_at')
      .eq('venue_id', assignment.venue_id)
      .order('checked_in_at', { ascending: false })
      .limit(8),
    supabase
      .from('occupancy_reports')
      .select('id, occupancy_pct, reported_at')
      .eq('venue_id', assignment.venue_id)
      .order('reported_at', { ascending: false })
      .limit(12),
  ])

  return {
    assignmentId: assignment.id,
    venue,
    activeCheckins: activeCheckins ?? 0,
    upcomingSessions: upcomingSessions ?? [],
    recentCheckins: recentCheckins ?? [],
    occupancyHistory: occupancyHistory ?? [],
  }
}

export async function getConversations(userId: string): Promise<ConversationPreview[]> {
  const supabase = await createClient()
  const blockedUserIds = await getBlockedUserIdSet(userId)

  const { data: matches } = await supabase
    .from('matches')
    .select('*, subjects:subject_id(*), venues:venue_id(*)')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .eq('status', 'accepted')
    .order('matched_at', { ascending: false })

  if (!matches) return []

  const conversations: ConversationPreview[] = []

  for (const match of matches) {
    const partnerId = match.user_a === userId ? match.user_b : match.user_a
    if (blockedUserIds.has(partnerId)) continue

    const { data: partner } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', partnerId)
      .single()

    const { data: lastMsg } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', match.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const lastReadAt = match.user_a === userId
      ? match.user_a_last_read_at ?? match.matched_at
      : match.user_b_last_read_at ?? match.matched_at

    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', match.id)
      .or(`sender_id.neq.${userId},sender_id.is.null`)
      .gt('created_at', lastReadAt)

    const { data: schedule } = await supabase
      .from('study_sessions')
      .select('*, partner:partner_id(display_name, avatar_color), subject:subject_id(name, name_en), venue:venue_id(*)')
      .eq('match_id', match.id)
      .in('status', ['proposed', 'confirmed'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    conversations.push({
      match,
      partner: partner!,
      lastMessage: lastMsg,
      unreadCount: count ?? 0,
      subject: (match as any).subjects ?? null,
      venue: (match as any).venues ?? null,
      schedule: schedule ?? null,
    })
  }

  return conversations
}

export async function getMessages(matchId: string): Promise<Message[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function getNotes(userId: string, subjectId?: number): Promise<Note[]> {
  const supabase = await createClient()
  const blockedUserIds = await getBlockedUserIdSet(userId)
  let query = supabase
    .from('notes')
    .select('*, author:author_id(display_name, avatar_color), subject:subject_id(name, name_en), note_likes(user_id)')
    .neq('moderation_status', 'hidden')
    .order('created_at', { ascending: false })

  if (subjectId) {
    query = query.eq('subject_id', subjectId)
  }

  const { data } = await query
  return (data ?? []).filter((note) => !blockedUserIds.has(note.author_id)).map((note) => {
    const likes = Array.isArray(note.note_likes) ? note.note_likes : []
    return {
      ...note,
      likes_count: likes.length,
      liked_by_me: likes.some((like: { user_id: string }) => like.user_id === userId),
      note_likes: undefined,
    }
  })
}

export async function getBlockedUsers(userId: string): Promise<BlockedUser[]> {
  const supabase = await createClient()
  const { data: blocks } = await supabase
    .from('user_blocks')
    .select('blocked_id, created_at')
    .eq('blocker_id', userId)
    .order('created_at', { ascending: false })

  if (!blocks?.length) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_color')
    .in('id', blocks.map((block) => block.blocked_id))

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  return blocks.map((block) => {
    const profile = profileMap.get(block.blocked_id)
    return {
      id: block.blocked_id,
      display_name: profile?.display_name ?? 'Student',
      avatar_color: profile?.avatar_color ?? 'bg-slate-500',
      blocked_at: block.created_at,
    }
  })
}

export async function getCoupons(userId: string): Promise<Coupon[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('coupons')
    .select('*, venue:venue_id(name)')
    .eq('user_id', userId)
    .is('redeemed_at', null)
    .order('expires_at', { ascending: true })
  return data ?? []
}

export async function getStudySessions(userId: string): Promise<StudySessionRecord[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('study_sessions')
    .select('*, owner:user_id(display_name, avatar_color), partner:partner_id(display_name, avatar_color), subject:subject_id(name, name_en), venue:venue_id(name)')
    .or(`user_id.eq.${userId},partner_id.eq.${userId}`)
    .order('starts_at', { ascending: true, nullsFirst: false })
  return data ?? []
}

export async function getStudyStats(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('study_sessions')
    .select('subject_id, duration_hours, subjects:subject_id(name)')
    .eq('user_id', userId)

  if (!data) return []

  const statsMap = new Map<number, { subject: string; hours: number }>()

  for (const row of data) {
    const existing = statsMap.get(row.subject_id!)
    if (existing) {
      existing.hours += row.duration_hours
    } else {
      statsMap.set(row.subject_id!, {
        subject: (row as any).subjects?.name ?? 'Unknown',
        hours: row.duration_hours,
      })
    }
  }

  return Array.from(statsMap.values()).sort((a, b) => b.hours - a.hours)
}

export async function getPastPartners(userId: string) {
  const supabase = await createClient()
  const { data: matches } = await supabase
    .from('matches')
    .select('user_a, user_b')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .in('status', ['accepted', 'ended'])

  if (!matches) return []

  const partnerCounts = new Map<string, number>()
  for (const m of matches) {
    const partnerId = m.user_a === userId ? m.user_b : m.user_a
    partnerCounts.set(partnerId, (partnerCounts.get(partnerId) ?? 0) + 1)
  }

  const partners = []
  for (const [partnerId, sessions] of partnerCounts) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', partnerId)
      .single()
    if (profile) {
      partners.push({ profile, sessions })
    }
  }

  return partners.sort((a, b) => b.sessions - a.sessions)
}
