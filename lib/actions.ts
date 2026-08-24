"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { PartnerCandidate } from '@/lib/types'
import { calculateMatchCompatibility } from '@/lib/match-compatibility'

const ALLOWED_DURATIONS = new Set(['1h', '2h', '4h'])
const ALLOWED_STUDY_STYLES = new Set(['quiet', 'social', 'either'])
const ALLOWED_LANGUAGES = new Set(['el', 'en', 'either'])
const REPORT_REASONS = new Set(['spam', 'harassment', 'unsafe', 'impersonation', 'copyright', 'other'])

function assertUuid(value: string, field: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`Invalid ${field}`)
  }
}

export async function createSession(formData: {
  subjectId: number
  venueId: string | null
  duration: string
  plannedStart: string
  studyStyle: string
  language: string
  maxDistanceKm: number
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
  if (!ALLOWED_STUDY_STYLES.has(formData.studyStyle)) throw new Error('Invalid study style')
  if (!ALLOWED_LANGUAGES.has(formData.language)) throw new Error('Invalid language')
  if (!Number.isFinite(formData.maxDistanceKm) || formData.maxDistanceKm < 0.5 || formData.maxDistanceKm > 50) {
    throw new Error('Invalid maximum distance')
  }

  const plannedStart = new Date(formData.plannedStart)
  const durationHours = Number.parseInt(formData.duration, 10)
  const plannedEnd = new Date(plannedStart.getTime() + durationHours * 60 * 60 * 1000)
  const latestAllowed = Date.now() + 31 * 24 * 60 * 60 * 1000
  if (!Number.isFinite(plannedStart.getTime()) || plannedStart.getTime() < Date.now() - 5 * 60 * 1000 || plannedStart.getTime() > latestAllowed) {
    throw new Error('Invalid study date')
  }
  const plannedDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Athens' }).format(plannedStart)

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
        planned_start: plannedStart.toISOString(),
        planned_end: plannedEnd.toISOString(),
        study_style: formData.studyStyle,
        language: formData.language,
        max_distance_km: formData.maxDistanceKm,
        status: 'active',
        expires_at: plannedEnd.toISOString(),
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
      planned_start: plannedStart.toISOString(),
      planned_end: plannedEnd.toISOString(),
      study_style: formData.studyStyle,
      language: formData.language,
      max_distance_km: formData.maxDistanceKm,
      status: 'active',
      expires_at: plannedEnd.toISOString(),
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

  const { data: ownProfile } = await supabase
    .from('profiles')
    .select('semester')
    .eq('id', user.id)
    .maybeSingle()

  const { data: candidates, error: candidatesError } = await supabase.rpc('find_match_candidates_private', {
    p_session_id: sessionId,
  })
  if (candidatesError) throw candidatesError

  const uniqueCandidates = new Map<string, PartnerCandidate>()
  for (const candidate of candidates ?? []) {
    if (uniqueCandidates.has(candidate.candidate_user_id)) continue
    const compatibility = calculateMatchCompatibility({
      ownStart: ownSession.planned_start ?? `${ownSession.planned_date}T12:00:00`,
      ownEnd: ownSession.planned_end ?? `${ownSession.planned_date}T14:00:00`,
      candidateStart: candidate.planned_start,
      candidateEnd: candidate.planned_end,
      ownStudyStyle: ownSession.study_style ?? 'either',
      candidateStudyStyle: candidate.study_style ?? 'either',
      ownLanguage: ownSession.language ?? 'either',
      candidateLanguage: candidate.language ?? 'either',
      ownVenueId: ownSession.venue_id,
      candidateVenueId: candidate.venue_id,
      ownSemester: ownProfile?.semester ?? 1,
      candidateSemester: candidate.semester ?? 1,
      candidateDistanceKm: Number(candidate.distance) || 0,
      maximumDistanceKm: Number(ownSession.max_distance_km ?? 5),
    })
    if (!compatibility) continue

    uniqueCandidates.set(candidate.candidate_user_id, {
      id: candidate.candidate_user_id,
      sessionId: candidate.candidate_session_id,
      name: candidate.display_name || 'Student',
      initials: (candidate.display_name || 'S').slice(0, 2).toUpperCase(),
      degree: candidate.degree || '',
      semester: candidate.semester || 1,
      subjects: candidate.subjects?.length ? candidate.subjects : [String(ownSession.subject_id)],
      avatarColor: candidate.avatar_color || 'bg-blue-500',
      distance: Number(candidate.distance) || 0,
      timeOverlap: compatibility.timeOverlap,
      compatibilityScore: compatibility.compatibilityScore,
      compatibilityReasons: compatibility.compatibilityReasons,
      plannedStart: candidate.planned_start ?? null,
      plannedEnd: candidate.planned_end ?? null,
      studyStyle: candidate.study_style ?? 'either',
      language: candidate.language ?? 'either',
    })
  }

  return Array.from(uniqueCandidates.values()).sort((a, b) => {
    if (b.compatibilityScore !== a.compatibilityScore) return b.compatibilityScore - a.compatibilityScore
    return a.distance - b.distance
  })
}

export async function proposeStudySession(formData: {
  matchId: string
  startsAt: string
  endsAt: string
  venueId: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  assertUuid(formData.matchId, 'match')
  if (formData.venueId) assertUuid(formData.venueId, 'venue')

  const start = new Date(formData.startsAt)
  const end = new Date(formData.endsAt)
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start <= new Date() || end <= start || end.getTime() - start.getTime() > 8 * 60 * 60 * 1000) {
    throw new Error('Invalid schedule')
  }

  const { data, error } = await supabase.rpc('propose_study_session', {
    p_match_id: formData.matchId,
    p_starts_at: start.toISOString(),
    p_ends_at: end.toISOString(),
    p_venue_id: formData.venueId,
  })
  if (error) throw error
  revalidatePath('/app')
  return String(data)
}

export async function respondToStudySession(sessionId: string, accept: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  assertUuid(sessionId, 'study session')
  const { error } = await supabase.rpc('respond_study_session', { p_session_id: sessionId, p_accept: accept })
  if (error) throw error
  revalidatePath('/app')
}

export async function cancelStudySession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  assertUuid(sessionId, 'study session')
  const { error } = await supabase.rpc('cancel_study_session', { p_session_id: sessionId })
  if (error) throw error
  revalidatePath('/app')
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

export async function endMatch(matchId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  assertUuid(matchId, 'match')

  const { error } = await supabase.rpc('end_match', { p_match_id: matchId })
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

  const title = String(formData.get('title') ?? '').trim()
  const subjectId = Number.parseInt(String(formData.get('subjectId') ?? ''), 10)
  const file = formData.get('file')

  if (!title || title.length > 160) throw new Error('Title must be between 1 and 160 characters')
  if (!Number.isInteger(subjectId) || subjectId < 1) throw new Error('Invalid subject')
  if (!(file instanceof File) || file.size === 0) throw new Error('Please select a file')
  if (file.size > 10 * 1024 * 1024) throw new Error('The maximum file size is 10 MB')

  const allowedTypes: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  const extension = allowedTypes[file.type]
  if (!extension) throw new Error('Only PDF, JPG, PNG, and WEBP files are supported')

  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const startsWith = (...bytes: number[]) => bytes.every((byte, index) => header[index] === byte)
  const isValidSignature =
    (file.type === 'application/pdf' && startsWith(0x25, 0x50, 0x44, 0x46, 0x2d)) ||
    (file.type === 'image/jpeg' && startsWith(0xff, 0xd8, 0xff)) ||
    (file.type === 'image/png' && startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) ||
    (file.type === 'image/webp' && startsWith(0x52, 0x49, 0x46, 0x46) && header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50)
  if (!isValidSignature) throw new Error('The file contents do not match its declared type')

  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('id', subjectId)
    .maybeSingle()
  if (!subject) throw new Error('Subject not found')

  const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await supabase.storage
    .from('notes')
    .upload(filePath, file, { contentType: file.type, upsert: false })

  if (uploadError) throw new Error(`File upload failed: ${uploadError.message}`)

  const { data, error } = await supabase
    .from('notes')
    .insert({
      title,
      subject_id: subjectId,
      author_id: user.id,
      file_url: filePath,
    })
    .select()
    .single()

  if (error) {
    await supabase.storage.from('notes').remove([filePath])
    throw error
  }
  revalidatePath('/app')
  return data
}

export async function toggleNoteLike(noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  assertUuid(noteId, 'note')

  const { data: existing, error: existingError } = await supabase
    .from('note_likes')
    .select('note_id')
    .eq('user_id', user.id)
    .eq('note_id', noteId)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing) {
    const { error } = await supabase.from('note_likes').delete().eq('user_id', user.id).eq('note_id', noteId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('note_likes').insert({ user_id: user.id, note_id: noteId })
    if (error) throw error
  }

  const { count, error: countError } = await supabase
    .from('note_likes')
    .select('*', { count: 'exact', head: true })
    .eq('note_id', noteId)
  if (countError) throw countError

  revalidatePath('/app')
  return { liked: !existing, likesCount: count ?? 0 }
}

export async function updateNote(formData: { noteId: string; title: string; subjectId: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  assertUuid(formData.noteId, 'note')
  const title = formData.title.trim()
  if (!title || title.length > 160) throw new Error('Invalid title')
  if (!Number.isInteger(formData.subjectId) || formData.subjectId < 1) throw new Error('Invalid subject')

  const { data, error } = await supabase
    .from('notes')
    .update({ title, subject_id: formData.subjectId })
    .eq('id', formData.noteId)
    .eq('author_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('You can only edit your own notes')
  revalidatePath('/app')
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  assertUuid(noteId, 'note')

  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('file_url')
    .eq('id', noteId)
    .eq('author_id', user.id)
    .maybeSingle()
  if (noteError) throw noteError
  if (!note) throw new Error('You can only delete your own notes')

  const { error } = await supabase.from('notes').delete().eq('id', noteId).eq('author_id', user.id)
  if (error) throw error
  if (note.file_url && !/^https?:\/\//i.test(note.file_url)) {
    await supabase.storage.from('notes').remove([note.file_url])
  }
  revalidatePath('/app')
}

function validateReport(reason: string, details = '') {
  if (!REPORT_REASONS.has(reason)) throw new Error('Invalid report reason')
  if (details.trim().length > 500) throw new Error('Report details are too long')
}

export async function reportNote(noteId: string, reason: string, details = '') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  assertUuid(noteId, 'note')
  validateReport(reason, details)

  const { error } = await supabase.rpc('report_note', {
    p_note_id: noteId,
    p_reason: reason,
    p_details: details.trim() || null,
  })
  if (error) throw error
  revalidatePath('/app')
}

export async function blockUser(blockedUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  assertUuid(blockedUserId, 'user')
  if (blockedUserId === user.id) throw new Error('You cannot block yourself')

  const { error } = await supabase
    .from('user_blocks')
    .upsert({ blocker_id: user.id, blocked_id: blockedUserId }, { onConflict: 'blocker_id,blocked_id' })
  if (error) throw error
  revalidatePath('/app')
}

export async function unblockUser(blockedUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  assertUuid(blockedUserId, 'user')

  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedUserId)
  if (error) throw error
  revalidatePath('/app')
}

export async function reportUser(reportedUserId: string, reason: string, details = '') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  assertUuid(reportedUserId, 'user')
  if (reportedUserId === user.id) throw new Error('You cannot report yourself')
  validateReport(reason, details)

  const { error } = await supabase
    .from('user_reports')
    .upsert({
      reporter_id: user.id,
      reported_id: reportedUserId,
      reason,
      details: details.trim() || null,
      status: 'open',
    }, { onConflict: 'reporter_id,reported_id' })
  if (error) throw error
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

export async function toggleVenueCheckin(venueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  assertUuid(venueId, 'venue')

  const { data, error } = await supabase.rpc('toggle_venue_checkin', { p_venue_id: venueId })
  if (error) throw error
  revalidatePath('/app')
  revalidatePath('/venue-manager')
  return Boolean(data)
}

export async function updateManagedVenue(formData: {
  isOpen: boolean
  occupancy: number
  discount: number | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (!Number.isInteger(formData.occupancy) || formData.occupancy < 0 || formData.occupancy > 100) {
    throw new Error('Invalid occupancy')
  }
  if (formData.discount !== null && (!Number.isInteger(formData.discount) || formData.discount < 0 || formData.discount > 100)) {
    throw new Error('Invalid discount')
  }

  const { error } = await supabase.rpc('update_managed_venue', {
    p_is_open: formData.isOpen,
    p_occupancy: formData.occupancy,
    p_discount: formData.discount,
  })
  if (error) throw error
  revalidatePath('/app')
  revalidatePath('/venue-manager')
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

  const displayName = formData.displayName?.trim()
  const degree = formData.degree?.trim()
  if (displayName !== undefined && (displayName.length < 1 || displayName.length > 80)) {
    throw new Error('Invalid display name')
  }
  if (degree !== undefined && degree.length > 120) {
    throw new Error('Invalid degree')
  }
  if (formData.semester !== undefined && (!Number.isInteger(formData.semester) || formData.semester < 1 || formData.semester > 12)) {
    throw new Error('Invalid semester')
  }

  const updates: {
    display_name?: string
    degree?: string
    semester?: number
    subjects?: string[]
  } = {}
  if (displayName !== undefined) updates.display_name = displayName
  if (degree !== undefined) updates.degree = degree
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
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) throw error
  redirect('/auth/login')
}
