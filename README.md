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

## Authentication setup

Email/password sign-in, password recovery, Google OAuth, profile editing, password changes, and current-session logout are implemented.

In Supabase **Authentication → URL Configuration**:

- Set the local Site URL to `http://localhost:3000` while developing.
- Add `http://localhost:3000/**` and `http://127.0.0.1:3000/**` to the redirect allow list.
- Add the production HTTPS URL to the allow list before deploying.

To enable Google sign-in:

1. Create a Web OAuth client in Google Auth Platform.
2. Add `http://localhost:3000` as an authorized JavaScript origin.
3. Copy the callback URL shown in Supabase **Authentication → Providers → Google** into Google’s authorized redirect URIs. It has the form `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Add the Google client ID and secret to the Supabase Google provider and enable it.

For production, add the deployed origin in Google and the deployed callback route (`https://<domain>/auth/callback`) to the Supabase redirect allow list.
