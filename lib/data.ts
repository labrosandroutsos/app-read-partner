import { createClient } from '@/lib/supabase/server'
import type {
  Profile, Subject, Venue, Match, Message, Note, Coupon,
  StudySessionRecord, ConversationPreview
} from '@/lib/types'

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

export async function getConversations(userId: string): Promise<ConversationPreview[]> {
  const supabase = await createClient()

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

    conversations.push({
      match,
      partner: partner!,
      lastMessage: lastMsg,
      unreadCount: count ?? 0,
      subject: (match as any).subjects ?? null,
      venue: (match as any).venues ?? null,
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

export async function getNotes(subjectId?: number): Promise<Note[]> {
  const supabase = await createClient()
  let query = supabase
    .from('notes')
    .select('*, author:author_id(display_name, avatar_color), subject:subject_id(name, name_en)')
    .order('created_at', { ascending: false })

  if (subjectId) {
    query = query.eq('subject_id', subjectId)
  }

  const { data } = await query
  return data ?? []
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
    .select('*, partner:partner_id(display_name, avatar_color), subject:subject_id(name, name_en), venue:venue_id(name)')
    .or(`user_id.eq.${userId},partner_id.eq.${userId}`)
    .order('date', { ascending: true })
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
    .eq('status', 'accepted')

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
