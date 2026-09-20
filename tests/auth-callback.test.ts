import { beforeEach, describe, expect, it, vi } from 'vitest'
const { exchange } = vi.hoisted(() => ({ exchange: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { exchangeCodeForSession: exchange } }) }))
import { GET } from '../app/auth/callback/route'

beforeEach(() => { exchange.mockReset(); exchange.mockResolvedValue({ error: null }) })
describe('OAuth callback stays inside the current origin', () => {
  it('returns a relative success redirect even when server origin differs from the client', async () => {
    const response = await GET(new Request('http://localhost:3000/auth/callback?code=one-time-code', { headers: { host: '127.0.0.1:3000' } }))
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('/app')
    expect(new URL(response.headers.get('location')!, 'http://127.0.0.1:3000').origin).toBe('http://127.0.0.1:3000')
    expect(exchange).toHaveBeenCalledWith('one-time-code')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
  it('keeps exchange failures and missing codes inside the app too', async () => {
    const missing = await GET(new Request('http://localhost:3000/auth/callback'))
    expect(exchange).not.toHaveBeenCalled()
    expect(missing.headers.get('location')).toBe('/auth/error')
    exchange.mockResolvedValue({ error: { message: 'Invalid code' } })
    expect((await GET(new Request('http://localhost:3000/auth/callback?code=bad'))).headers.get('location')).toBe('/auth/error')
  })
  it('preserves valid internal destinations', async () => {
    const result = await GET(new Request('https://internal/auth/callback?code=code&next=' + encodeURIComponent('/app?tab=chat')))
    expect(result.headers.get('location')).toBe('/app?tab=chat')
  })
  it.each(['https://attacker.example', '//attacker.example', '/\\attacker.example', '/x/..//attacker.example', '/app\r\nLocation: https://attacker.example'])('rejects unsafe next destinations: %s', async next => {
    const result = await GET(new Request('https://internal/auth/callback?code=code&next=' + encodeURIComponent(next)))
    expect(result.headers.get('location')).toBe('/app')
  })
})
