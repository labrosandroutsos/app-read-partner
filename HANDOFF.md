# Handoff — UI/UX design pass

## Branch
- **Working branch:** `claude/ui-ux-research-enhancements-f09a6d` (pushed to `origin`, repo `labrosandroutsos/app-read-partner`).
- **`main` is untouched** at `914d137`. This branch = `main` (working code + backend) → Codex's design branch (`design/calm-study-experience`) → this design pass (3 commits).
- To review: `git diff main...claude/ui-ux-research-enhancements-f09a6d`.
- The 3 commits from this pass, newest first: `2607ab9` (palette switcher + wording), `198a997` (bespoke tab redesigns), `22c5f24` (research-driven design system). Everything below them (`bec8d0a`…`2f25f5f`) is Codex's prior design work this branch builds on.

## App in one line
"Read Partner" — bilingual (Greek/English), iPhone-first web app to find university study partners: swipe-to-match, chat, notes, study venues, profile. Next.js 16 / React 19 / Tailwind v4 / shadcn+Radix / Supabase. Preview all screens without login at **`/design-preview`** (dev only).

## Colour decision
**Green is the confirmed primary** (the default — no `data-palette` attribute). Four alternate palettes (terracotta, indigo, berry, violet) exist in `app/globals.css` and are switchable only via the dev preview's "Colour" row; they are inert in production. They can stay as a tuning tool or be deleted — removing them is just deleting the `[data-palette=…]` blocks in `app/globals.css` and the switcher in `components/design-preview.tsx`.

## What changed in this pass

**Design foundation** (`app/globals.css`, `app/layout.tsx`)
- Fonts switched to **Manrope** (UI/body) + **Piazzolla** (hero serif, class `.study-title`), both with a verified **Greek subset** (the previous Georgia serif silently fell back to a mismatched system face for Greek). Loaded via `next/font/google`.
- Warm-tinted layered shadow scale (`--shadow-*`), warm green-charcoal **dark mode** (was cold blue), soft background radial warmth + ~3% film grain, motion tokens (`--ease-out-quint/back`).
- Token additions: `--primary-cta`, `--primary-cta-strong`, `--primary-hover`, `--card-elevated`, `--accent-strong`.

**Components**
- `components/ui/button.tsx` — gradient primary + CTA glow + press.
- `components/partner/partner-stack.tsx` — swipe hero: velocity commit, rising next card, soft wash + blurred "Connect"/"Skip" pill overlays (no red/green stamps), rewind (after a skip only), haptics.
- `components/partner/partner-card.tsx`, `match-animation.tsx`, `daily-wizard.tsx` — warmer card, celebration with suggested opener + reduced-motion sparkles, subject cards with colour chips.
- `components/bottom-tab-bar.tsx` — frosted glass + springy active pill.
- Bespoke tab passes: `chat/chat-list.tsx` + `chat/chat-view.tsx` (ring avatars, subject pills, gradient outgoing bubbles, glass composer), `notes/note-card.tsx` (subject-colour-coded), `venues/venue-card.tsx` (type icon, occupancy label, distance/discount chips), `profile/profile-header.tsx` + `profile/study-stats.tsx` (cover-card header, colour-coded bars).

**iOS / PWA**
- `app/layout.tsx`: added `viewport-fit=cover` (the existing `env(safe-area-inset-*)` padding was doing nothing on iPhone without it) + `appleWebApp` metadata + theme colours.
- `app/manifest.ts`: new PWA manifest (standalone, cream/green colours).
- Global `overscroll-behavior: none`, `touch-pan-y` on the swipe card.

**Copy**
- Search step-2 heading reworded to «Διάλεξε μέρα και ώρα» / "Pick a day and time" (`components/partner/daily-wizard.tsx`).

**Utilities / docs**
- `lib/haptics.ts` — Android-only progressive enhancement (iOS Safari has no `navigator.vibrate`); no-ops under reduced motion; pair with a visual press.
- `DESIGN.md` — full design changelog.

## Verified
57/57 tests pass (`npm run test:run`), `npm run typecheck` clean, `npm run build` succeeds. Visual checks done at 375px in the in-app browser, light + dark. **Not** verified on a physical iPhone or in authenticated multi-user flows.

## Open items / suggested next steps
1. **Real-device iOS pass** — verify safe-area insets, standalone PWA, and the swipe gesture on an actual iPhone.
2. **Chat composer bottom spacing** — still uses Codex's original hard-coded `h-10` spacer (`components/chat/chat-view.tsx`), not the safe-area inset; left as-is because the authenticated chat layout couldn't be tested here. Make it `env(safe-area-inset-bottom)`-aware and verify.
3. **Alternate palettes** — keep as a dev tuning tool or delete (see Colour decision above).
4. **Fonts** — an alternate Greek-capable type pairing was offered but not explored; current is Manrope + Piazzolla.
5. **theme-color / manifest** — already green; no change needed for the green decision.
6. Decide whether to open a PR into `main` (none opened yet).

## Env note
Local dev needs `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`). `/design-preview` renders with placeholder values since it uses local fixtures.
