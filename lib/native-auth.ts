/** Redirect only into our app, or the loopback Expo Go client during local development. */
export function nativeAuthRedirect(input: URL, development: boolean): URL | null {
  const returnUri = input.searchParams.get('return_uri')
  const state = input.searchParams.get('state')
  if (!returnUri || !state || !/^[a-f0-9]{64}$/.test(state)) return null
  let target: URL
  try { target = new URL(returnUri) } catch { return null }
  if (target.username || target.password || target.search || target.hash) return null
  const native = returnUri === 'readpartner://auth/callback'
  const simulator = development && target.protocol === 'exp:'
    && ['127.0.0.1', 'localhost'].includes(target.hostname)
    && target.port === '8081' && target.pathname === '/--/auth/callback'
  if (!native && !simulator) return null
  target.searchParams.set('state', state)
  const code = input.searchParams.get('code')
  if (input.searchParams.has('error') || !code || code.length > 2048 || !/^[a-zA-Z0-9_-]+$/.test(code)) {
    target.searchParams.set('error', 'authentication_failed')
  } else {
    target.searchParams.set('code', code)
  }
  return target
}
