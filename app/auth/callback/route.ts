import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(value)) return '/app'
  const parsed = new URL(value, 'https://read-partner.invalid')
  if (parsed.origin !== 'https://read-partner.invalid' || parsed.pathname.startsWith('//')) return '/app'
  return `${parsed.pathname}${parsed.search}${parsed.hash}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  let location = '/auth/error'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) location = safeNextPath(searchParams.get('next'))
  }

  // Keep the WebView's origin. Next's server-side request.url can use localhost
  // even when the browser reached us through 127.0.0.1 or a reverse proxy.
  return new NextResponse(null, {
    status: 303,
    headers: { Location: location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  })
}
