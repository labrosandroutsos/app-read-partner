import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Invalid note' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', _request.url))
  }

  const { data: note, error } = await supabase
    .from('notes')
    .select('file_url, title')
    .eq('id', id)
    .single()

  if (error || !note?.file_url) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  if (/^https?:\/\//i.test(note.file_url)) {
    await supabase.rpc('register_note_download', { p_note_id: id })
    return NextResponse.redirect(note.file_url)
  }

  const extension = note.file_url.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'pdf'
  const safeTitle = note.title.replace(/[^\p{L}\p{N}._ -]+/gu, '').trim() || 'notes'
  const safeFilename = `${safeTitle}.${extension}`
  const { data, error: signedUrlError } = await supabase.storage
    .from('notes')
    .createSignedUrl(note.file_url, 60, { download: safeFilename })

  if (signedUrlError || !data?.signedUrl) {
    return NextResponse.json({ error: 'Unable to prepare download' }, { status: 500 })
  }

  await supabase.rpc('register_note_download', { p_note_id: id })
  return NextResponse.redirect(data.signedUrl)
}
