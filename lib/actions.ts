"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { PartnerCandidate } from '@/lib/types'

const ALLOWED_DURATIONS = new Set(['1h', '2h', '4h'])

function assertUuid(value: string, field: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`Invalid ${field}`)
  }
}

export async function createSession(formData: {
  subjectId: number
  venueId: string | null
  duration: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (!Number.isInteger(formData.subjectId) || formData.subjectId < 1) {
    throw new Error('Invalid subject')
  }
  if (formData.venueId) assertUuid(formData.venueId, 'venue')
  if (!ALLOWED_DURATIONS.has(formData.duration)) {
    throw new Error('Invalid duration')
  }

  const plannedDate = new Date().toISOString().split('T')[0]

  const { data: existingSession, error: existingError } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('planned_date', plannedDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) throw existingError

  if (existingSession) {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        subject_id: formData.subjectId,
        venue_id: formData.venueId,
        duration: formData.duration,
      })
      .eq('id', existingSession.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    revalidatePath('/app')
    return data
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      subject_id: formData.subjectId,
      venue_id: formData.venueId,
      duration: formData.duration,
      planned_date: plannedDate,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/app')
  return data
}

export async function findMatchCandidates(sessionId: string): Promise<PartnerCandidate[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  assertUuid(sessionId, 'session')

  const { data: ownSession, error: ownSessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (ownSessionError || !ownSession) throw ownSessionError ?? new Error('Session not found')

  let query = supabase
    .from('sessions')
    .select('*, profiles:user_id(*), venues:venue_id(distance)')
    .eq('planned_date', ownSession.planned_date)
    .eq('subject_id', ownSession.subject_id)
    .neq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (ownSession.venue_id) {
    query = query.or(`venue_id.eq.${ownSession.venue_id},venue_id.is.null`)
  }

  const [{ data: sessions, error: sessionsError }, { data: existingMatches, error: matchesError }] = await Promise.all([
    query,
    supabase
      .from('matches')
      .select('user_a, user_b, status')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
  ])

  if (sessionsError) throw sessionsError
  if (matchesError) throw matchesError

  const hiddenPartnerIds = new Set<string>()
  for (const match of existingMatches ?? []) {
    const partnerId = match.user_a === user.id ? match.user_b : match.user_a
    const isOutgoing = match.user_a === user.id
    if (isOutgoing || match.status === 'accepted') hiddenPartnerIds.add(partnerId)
  }

  const uniqueCandidates = new Map<string, PartnerCandidate>()
  for (const session of sessions ?? []) {
    const profile = session.profiles as {
      id: string
      display_name: string | null
      degree: string | null
      semester: number | null
      subjects: string[] | null
      avatar_color: string | null
    } | null

    if (!profile || hiddenPartnerIds.has(profile.id) || uniqueCandidates.has(profile.id)) continue

    const sameDuration = session.duration === ownSession.duration
    const venue = session.venues as { distance: number | null } | null

    uniqueCandidates.set(profile.id, {
      id: profile.id,
      sessionId: session.id,
      name: profile.display_name || 'Student',
      initials: (profile.display_name || 'S').slice(0, 2).toUpperCase(),
      degree: profile.degree || '',
      semester: profile.semester || 1,
      subjects: profile.subjects?.length ? profile.subjects : [String(session.subject_id)],
      avatarColor: profile.avatar_color || 'bg-blue-500',
      distance: venue?.distance ?? 0,
      timeOverlap: sameDuration ? 100 : 75,
    })
  }

  return Array.from(uniqueCandidates.values()).sort((a, b) => {
    if (b.timeOverlap !== a.timeOverlap) return b.timeOverlap - a.timeOverlap
    return a.distance - b.distance
  })
}

export async function swipeOnCandidate(sessionId: string, candidateSessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  assertUuid(sessionId, 'session')
  assertUuid(candidateSessionId, 'candidate session')

  const { data, error } = await supabase.rpc('swipe_on_session', {
    p_session_id: sessionId,
    p_candidate_session_id: candidateSessionId,
  })

  if (error) throw error

  const result = Array.isArray(data) ? data[0] : data
  if (!result) throw new Error('Unable to record swipe')

  revalidatePath('/app')
  return { matched: Boolean(result.matched), matchId: String(result.match_id) }
}

export async function markConversationRead(matchId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  assertUuid(matchId, 'match')

  const { error } = await supabase.rpc('mark_match_read', { p_match_id: matchId })
  if (error) throw error

  revalidatePath('/app')
}

export async function sendMessage(matchId: string, text: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  assertUuid(matchId, 'match')
  const message = text.trim()
  if (!message || message.length > 2000) throw new Error('Invalid message')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: user.id,
      text: message,
      is_system: false,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function uploadNote(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const title = formData.get('title') as string
  const subjectId = parseInt(formData.get('subjectId') as string)
  const file = formData.get('file') as File | null

  let fileUrl: string | null = null

  if (file && file.size > 0) {
    const ext = file.name.split('.').pop()
    const path = `notes/${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('notes')
      .upload(path, file)

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('notes').getPublicUrl(path)
      fileUrl = urlData.publicUrl
    }
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({
      title,
      subject_id: subjectId,
      author_id: user.id,
      file_url: fileUrl,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/app')
  return data
}

export async function toggleNoteLike(noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('note_likes')
    .select()
    .eq('user_id', user.id)
    .eq('note_id', noteId)
    .single()

  if (existing) {
    await supabase.from('note_likes').delete().eq('user_id', user.id).eq('note_id', noteId)
    const { error } = await supabase.rpc('decrement_likes', { note_id_input: noteId })
    if (error) throw error
  } else {
    await supabase.from('note_likes').insert({ user_id: user.id, note_id: noteId })
    const { error } = await supabase.rpc('increment_likes', { note_id_input: noteId })
    if (error) throw error
  }

  revalidatePath('/app')
}

export async function reportOccupancy(venueId: string, occupancyPct: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('occupancy_reports').insert({
    venue_id: venueId,
    user_id: user.id,
    occupancy_pct: occupancyPct,
  })

  if (error) throw error
  revalidatePath('/app')
}

export async function redeemCoupon(couponId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('coupons')
    .update({ redeemed_at: new Date().toISOString() })
    .eq('id', couponId)

  if (error) throw error
  revalidatePath('/app')
}

export async function updateProfile(formData: {
  displayName?: string
  degree?: string
  semester?: number
  subjects?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const updates: any = {}
  if (formData.displayName !== undefined) updates.display_name = formData.displayName
  if (formData.degree !== undefined) updates.degree = formData.degree
  if (formData.semester !== undefined) updates.semester = formData.semester
  if (formData.subjects !== undefined) updates.subjects = formData.subjects

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) throw error
  revalidatePath('/app')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
