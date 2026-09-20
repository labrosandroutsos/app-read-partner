import { NextResponse } from 'next/server'
import { nativeAuthRedirect } from '@/lib/native-auth'

export async function GET(request: Request) {
  const target = nativeAuthRedirect(new URL(request.url), process.env.NODE_ENV === 'development')
  const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }
  if (!target) return new NextResponse('Invalid native authentication callback', { status: 400, headers })
  // Do not exchange here: Safari does not own the WebView's PKCE verifier cookie.
  return new NextResponse(null, { status: 302, headers: { ...headers, Location: target.toString() } })
}
