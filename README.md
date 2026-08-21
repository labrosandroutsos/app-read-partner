# Read Partner

Read Partner is a bilingual, mobile-first web app for finding university study partners, chatting in real time, sharing notes, and discovering study venues.

## Local setup

1. Use Node.js 20 or 22.
2. Copy `.env.example` to `.env.local` and add the URL and anonymous key from your Supabase project.
3. Run the SQL files in `scripts/` in numeric order using the Supabase SQL editor.
4. Install dependencies with `npm install`.
5. Start the app with `npm run dev`.

Useful checks:

```bash
npm run typecheck
npm run build
```

The project path must not contain a literal backslash (`\\`). Node's ESM resolver encodes it as `%5C`, which prevents Next.js from starting. Rename the current parent folder from `Tzo_project\\` to `Tzo_project` before running the app from its permanent location.

## Current architecture

- `app/` — Next.js routes and authentication pages
- `components/` — mobile UI and feature screens
- `lib/actions.ts` — authenticated server mutations and matching queries
- `lib/data.ts` — server-side page data
- `lib/supabase/` — browser, server, and proxy clients
- `scripts/` — ordered Supabase schema, policy, seed, and function migrations

Matching is database-backed: each user creates a daily search session, sees compatible sessions, and records a swipe through `swipe_on_session`. A chat is created only after a mutual right swipe.
