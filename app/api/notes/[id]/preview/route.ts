import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAccessContext } from '@/lib/data'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: 'Invalid note' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))
  const access = await getAccessContext(user.id)
  if (access.suspension) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })

  const { data: note, error } = await supabase
    .from('notes')
    .select('file_url, moderation_status, author_id')
    .eq('id', id)
    .single()

  if (error || !note?.file_url || (note.moderation_status === 'hidden' && !access.role)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const { data: block } = await supabase
    .from('user_blocks')
    .select('blocker_id')
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${note.author_id}),and(blocker_id.eq.${note.author_id},blocked_id.eq.${user.id})`)
    .limit(1)
    .maybeSingle()
  if (block) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  if (/^https?:\/\//i.test(note.file_url)) return NextResponse.redirect(note.file_url)

  const { data, error: signedUrlError } = await supabase.storage
    .from('notes')
    .createSignedUrl(note.file_url, 300)

  if (signedUrlError || !data?.signedUrl) {
    return NextResponse.json({ error: 'Unable to prepare preview' }, { status: 500 })
  }
  return NextResponse.redirect(data.signedUrl)
}
