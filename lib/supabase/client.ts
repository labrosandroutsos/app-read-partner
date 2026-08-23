import { createBrowserClient } from '@supabase/ssr'

function makeBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

let browserClient: ReturnType<typeof makeBrowserClient> | undefined

export function createClient() {
  if (!browserClient) {
    browserClient = makeBrowserClient()
  }
  return browserClient
}
