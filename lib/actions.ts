"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSession(formData: {
  subjectId: number
  venueId: string | null
  duration: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      subject_id: formData.subjectId,
      venue_id: formData.venueId,
      duration: formData.duration,
      planned_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/app')
  return data
}

export async function createMatch(sessionAId: string, partnerId: string, subjectId: number, venueId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if partner already swiped right on us
  const { data: existing } = await supabase
    .from('matches')
    .select('*')
    .eq('user_a', partnerId)
    .eq('user_b', user.id)
    .eq('status', 'pending')
    .single()

  if (existing) {
    // Mutual match — accept
    await supabase
      .from('matches')
      .update({ status: 'accepted' })
      .eq('id', existing.id)

    // Create system message
    await supabase.from('messages').insert({
      match_id: existing.id,
      sender_id: null,
      text: 'Match confirmed! Start chatting.',
      is_system: true,
    })

    revalidatePath('/app')
    return { matched: true, matchId: existing.id }
  }

  // Create pending match
  const { data, error } = await supabase
    .from('matches')
    .insert({
      user_a: user.id,
      user_b: partnerId,
      session_a: sessionAId,
      subject_id: subjectId,
      venue_id: venueId,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/app')
  return { matched: false, matchId: data.id }
}

export async function respondToMatch(matchId: string, accept: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('matches')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('id', matchId)

  if (error) throw error

  if (accept) {
    await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: null,
      text: 'Match accepted! Start chatting.',
      is_system: true,
    })
  }

  revalidatePath('/app')
}

export async function sendMessage(matchId: string, text: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: user.id,
      text,
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
    await supabase.rpc('decrement_likes', { note_id_input: noteId }).catch(() => {
      // Fallback: manual update
      supabase.from('notes').update({ likes_count: existing ? 0 : 1 }).eq('id', noteId)
    })
  } else {
    await supabase.from('note_likes').insert({ user_id: user.id, note_id: noteId })
    await supabase.rpc('increment_likes', { note_id_input: noteId }).catch(() => {
      supabase.from('notes').update({ likes_count: 1 }).eq('id', noteId)
    })
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
