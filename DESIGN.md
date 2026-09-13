# Design system & UX notes

This branch builds on the `design/calm-study-experience` foundation and pushes it further,
guided by research into how modern swipe-match and warm consumer mobile apps are built
(2024–2026 conventions). It keeps the cream-and-green identity and iPhone-first focus.

## Foundations (`app/globals.css`, `app/layout.tsx`)

- **Typography — Greek-capable fonts.** Switched from Georgia (a web-safe fallback serif that
  silently dropped to the system font for Greek) to **Manrope** for all UI/body text and
  **Piazzolla** for hero headlines. Both ship a verified Greek subset — essential for the
  bilingual audience — loaded via `next/font/google` with `subsets: ['latin','greek']`.
  The Piazzolla serif is reserved for hero moments only (`.study-title`): the onboarding
  headline, the login hero, the match celebration, and the empty state.
- **Warm-tinted, layered shadows.** Replaced flat single-layer shadows with a 2–3 layer scale
  tinted with the brand green hue (pure-black shadows read grey/dirty on cream). Exposed as the
  standard `shadow-sm/md/lg/xl` Tailwind utilities plus a `--shadow-cta` colored glow for the
  one hero CTA per screen.
- **Warm dark mode.** Re-tuned dark from cold blue-gray (hue 250) to a warm green-charcoal
  (hue ~160), so the app stays in its brand family at night — easier on the eyes for evening
  study. Elevation comes from surface-lightness steps rather than invisible shadows.
- **Depth & warmth.** Soft radial warmth from the top of the background, a ~3% film-grain
  texture on the background only, generous continuous-feel corners (20–24px on cards), and an
  amber accent given a defined role (matches, waiting/streak states, celebration).
- **Motion tokens.** `--ease-out-quint` (fly-off/enter), `--ease-out-back` (press/pop),
  `--ease-in-out-soft`. All motion respects `prefers-reduced-motion`.

## Components

- **Button** — tactile gradient primary (`--primary-cta` → `--primary-cta-strong`) with the
  CTA glow and an `active:scale-[0.97]` press. Larger radius, Manrope semibold.
- **Partner swipe stack** (`partner-stack.tsx`) — the hero. Velocity-aware commit (fast flicks
  register), rotation anchored low so the card pivots like a physical card, the **next card
  rises to meet you** as you drag, and the dated red/green LIKE/NOPE stamps are replaced by a
  soft edge wash + a blurred pill chip ("Connect" / "Ας τα πούμε" in warm green, "Skip" /
  "Άλλη φορά" in neutral grey — never hostile red). Adds a **rewind** affordance (offered only
  after a skip, since a sent like can't be un-sent) and progressive haptics.
- **Match celebration** (`match-animation.tsx`) — warmer, ≤700ms, with restrained sparkles
  (reduced-motion aware), a **suggested opener**, and an immediate "Say hi" CTA to shrink the
  match→first-message gap.
- **Bottom tab bar** — frosted glass so content scrolls under it, a springy active pill,
  and safe-area padding.
- **Onboarding subject cards** — colored letter chips and a warmer selected state give the
  first-run screen character instead of empty white rectangles.

## iOS / PWA

- **`viewport-fit=cover`** added — the app already coded `env(safe-area-inset-*)` padding, but
  without this the insets were always 0 on iPhone. This activates them.
- **PWA manifest** (`app/manifest.ts`) + `appleWebApp` metadata for installable, standalone,
  full-screen behavior with the correct theme colors.
- Global `overscroll-behavior: none` (kills whole-page rubber-band), `touch-pan-y` on the
  swipe card, transparent tap highlight, and 16px minimum input font (already present).

## Haptics (`lib/haptics.ts`)

iOS Safari does **not** support `navigator.vibrate`, so haptics are a progressive enhancement
for Android; the always-on visual "press" is what makes taps feel responsive everywhere.
All calls no-op under reduced motion.

## Previewing

`/design-preview` (dev only) renders every tab with sample data. It now also has a
**"Preview swipe deck"** toggle to try the card stack without a backend session, plus the
existing **"Empty states"** toggle.
