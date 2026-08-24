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
npm run test:run
npm run typecheck
npm run build
```

Every feature should add or update tests for its business rules. Database and RLS changes also need an ordered migration plus an audit query; critical sign-in, matching, chat, upload, and scheduling journeys should be checked in the browser. The goal is risk-based coverage, not testing purely visual markup or chasing an arbitrary 100% number.

After applying migrations through `scripts/015_admin_and_moderation.sql`, run `scripts/rls_privacy_audit.sql` in the Supabase SQL editor. A successful audit returns `RLS privacy audit passed`.

### Bootstrap the first administrator

After applying `scripts/015_admin_and_moderation.sql`, choose an existing verified account and find its UUID in Supabase Authentication. Bootstrap it once from the SQL editor:

```sql
INSERT INTO public.user_roles(user_id, role)
VALUES ('ADMIN_PROFILE_UUID', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

Use a verified account that is not assigned as a venue manager. Assigning a
staff role converts that login into an operational account; it will no longer
use the student interface.

After signing in again, `/app` routes that account to `/admin`. Further admin and moderator roles, venue-manager assignments, venues, suspensions, moderation settings, and audit review are managed in the dashboard. Staff registration is never exposed publicly. Admins inherit moderator privileges; moderators cannot manage roles, venues, settings, other staff, or venue managers.

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

## Privacy setup

Set `NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL` to the controller's real privacy contact before deployment. Optional Vercel analytics is not loaded until a user opts in; essential authentication storage remains available when analytics is rejected. Review the included privacy and cookie text with the final controller identity, retention schedule, processor agreements, and legal adviser before public launch.
