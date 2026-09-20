import { describe, it, expect } from 'vitest'
import { nativeAuthRedirect } from '../lib/native-auth'
const state = 'a'.repeat(64)
function callback(returnUri: string, extra = '&code=example-code', nonce = state) {
  return new URL(`https://app.example/auth/native-callback?return_uri=${encodeURIComponent(returnUri)}&state=${nonce}${extra}`)
}
describe('native authentication callback', () => {
  it('returns a code and state only to the registered native callback', () => {
    const target = nativeAuthRedirect(callback('readpartner://auth/callback'), false)!
    expect(target.toString()).toBe(`readpartner://auth/callback?state=${state}&code=example-code`)
  })
  it('allows the local Expo simulator only in development', () => {
    const request = callback('exp://127.0.0.1:8081/--/auth/callback')
    expect(nativeAuthRedirect(request, true)).not.toBeNull()
    expect(nativeAuthRedirect(request, false)).toBeNull()
  })
  it.each(['https://attacker.example', 'readpartner://attacker/callback', 'readpartner://auth/callback?next=evil', 'readpartner://auth/callback#fragment', 'exp://attacker.example:8081/--/auth/callback', 'exp://127.0.0.1:9999/--/auth/callback', 'exp://user@127.0.0.1:8081/--/auth/callback'])('rejects an untrusted return address: %s', value => {
    expect(nativeAuthRedirect(callback(value), true)).toBeNull()
  })
  it('rejects missing or malformed state', () => {
    expect(nativeAuthRedirect(callback('readpartner://auth/callback', '&code=x', ''), false)).toBeNull()
  })
  it('returns a generic failure for provider errors and missing or malformed codes', () => {
    for (const extra of ['', '&error=denied&error_description=private', '&code=%3Cscript%3E']) {
      const target = nativeAuthRedirect(callback('readpartner://auth/callback', extra), false)!
      expect(target.searchParams.get('error')).toBe('authentication_failed')
      expect(target.searchParams.has('code')).toBe(false)
      expect(target.searchParams.has('error_description')).toBe(false)
    }
  })
})
