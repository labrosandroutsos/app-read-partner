import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const auth = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
    if (auth.protocol !== 'https:') throw new Error('Invalid authentication origin')
    // Only a public origin, never keys or session information.
    return NextResponse.json({ authOrigin: auth.origin }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 })
  }
}
