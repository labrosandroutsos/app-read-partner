# Read Partner review — 12 September 2026

Branch: `design/calm-study-experience`, based on `7d471e3`.
Primary platform: iPhone web experience. Desktop is secondary.

## Scope and evidence

Reviewed the local Git history, matching and notification migrations, authentication, app navigation, study wizard, chat data loading, note uploads and preview access, shared UI components, localization, and existing tests. The web implementation lives in UI_read_partner. The adjacent Expo project still renders its starter screen.

This is a focused code and UX review, not a completed production security audit. No remote GitHub fetch or live database migration was performed. Database deployment state, real account permissions, and multi-user delivery remain unverified.

## Implemented

- Warm cream/forest-green palette, editorial headings, quieter surfaces, and compatible dark-mode colors.
- New login introduction explaining the product and mutual connection, with a compact mobile layout.
- Clear labeled wizard progress, larger subject/venue selection buttons with native keyboard operation and announced selection, and a useful no-subjects state.
- Larger default buttons, visible focus, pinch-to-zoom enabled, reduced-motion support, top/bottom safe-area spacing, and upload-button positioning that works on narrow screens.
- Future study-time default rounded to a half-hour slot, including rollover after midnight; explicit invalid-time feedback and revalidation before submission.
- Reducing the distance filter clears a venue that is no longer selectable.
- Matching drafts and results survive switching tabs within the current app mount. Reload persistence is not implemented.
- Language choice persists locally and updates the HTML language. Full authentication localization is still outstanding.
- Missing/inaccessible chat partner profiles are skipped instead of passing null to components requiring a profile.
- User-facing connection failure text replaces developer configuration instructions on login; email/password autofill hints and announced errors added.
- Server Action request limit raised to 11 MB to accommodate the existing 10 MiB file validator and multipart overhead. The installed Next.js action handler defaults to 1 MB; the old config did not override it. Hosting providers can impose independent request limits.
- Development-only `/design-preview` uses sample subjects and makes no backend mutations. Production returns not found.

## Remaining findings, in priority order

### High: distance is presented as personal proximity but is static

`venues.distance` is a stored scalar (`scripts/001_create_tables.sql`), and `scripts/018_allow_instant_rematching.sql` returns that scalar for each candidate. No student origin is used. “Nearby” and maximum-distance filtering therefore cannot reliably mean distance from the student. Decide on a campus reference point and label it, or implement opt-in location with a clearly explained fallback. Do not request location just to use the app.

### High: test-only rematching behavior is in the migration chain

Commit `45300e4` removes the cooldown trigger in migration 018. Repeatedly ending and restarting matches can immediately surface the same person. Blocks remain important but are not a replacement for respectful dismissal behavior. Before launch, choose an explicit rematch policy and test it against candidate discovery and database enforcement together. This branch deliberately does not guess a new policy or alter production SQL.

### Medium: chat data loading scales poorly and masks failures

`lib/data.ts:getConversations` performs four sequential database reads per match after loading matches. Twenty matches mean roughly eighty dependent reads. Batch profile/schedule/message-summary retrieval with suitable query bounds or a permission-checked database summary function. Several data readers ignore errors and return empty collections, making outages look like “no content.” Add distinguishable error/retry states. The null-profile crash is fixed here, but the broader loading architecture is unchanged.

### Medium: mobile chat/history needs real-device and volume testing

`getMessages` requests the entire conversation without pagination. Long conversations can become slow or encounter backend row limits. Add cursor-based history loading and test reconnects, duplicate deliveries, message ordering, and read receipts with two accounts. In-app browser viewport checks do not prove iOS Safari keyboard behavior, VoiceOver, or installed-home-screen behavior.

### Medium: first-use matching depends on marketplace density

Students must overlap on subject, date/time, and preferences before a mutual connection. With a small launch cohort, a correct implementation can still feel broken. Existing pending-interest feedback helps, but broader-time suggestions and an explicit “keep this search active” explanation would help empty searches. Measure search-to-interest-to-mutual-match completion before adding more features.

### Medium: notification unread state can hide older activity

`getNotifications` loads the latest 50 notifications; interest badges derive from that subset rather than a separate unread count. Old unread interests can be missed when newer activity fills the window. Query unread counts separately and test more than 50 events. Migration 019 cleans expired interest notifications once, but expiry needs ongoing handling to avoid stale badges later.

### Medium: authentication language and privacy affordances are inconsistent

The main app supports Greek/English, while authentication pages remain English. The floating privacy button can compete with bottom-of-screen actions. Keep privacy preferences readily reachable in a stable settings/header location and test cookie banners with the keyboard open. Remaining small icon overrides should receive a full 44-point touch-target audit.

### Medium: preview routes retain legacy external redirects

The note preview/download implementation accepts legacy HTTP(S) file URLs. Audit stored legacy values and migrate to private storage paths; then remove this redirect branch or restrict it to trusted storage origins. New uploads already validate signatures, file size, and MIME type. This finding is a remaining trust-boundary concern, not a demonstrated exploit.

### Lower: maintainability and release confidence

`lib/actions.ts` combines many feature domains; joined query results use `any` casts; both npm and pnpm lockfiles are tracked. Choose one package manager, generate database types, and split server actions by feature as those areas change. Existing tests are useful but several inspect SQL source text; those cannot prove deployed RLS behavior. Run the supplied database privacy audit against a dedicated test instance. Authenticated matching, file delivery, schedules, and moderation need integration coverage.

## Validation

- TypeScript and unit tests pass: 57 tests across 10 files, including new midnight/default-time/date-window regression tests.
- Production build passes; sandbox initially prevented Turbopack from binding a worker port, then the authorized unsandboxed build succeeded.
- In-app browser: inspected login and the actual wizard component at 390 × 844 in light/dark modes; completed all four wizard steps using the local preview; confirmed draft retention across tab changes. Smaller 375 × 667 layout also inspected.
- Not validated: physical iPhone Safari, live sign-in/OAuth, actual 10 MB network upload, two-account matching/chat, deployed RLS or notification delivery. These require suitable test accounts and an isolated backend.

## How to review together

Run `npm run dev` and visit `/design-preview`. Start with the phone-sized layout. Ask her to find a partner without instructions, then ask what she expects after the final button. Use `/auth/login` to review the first impression. The preview is intentionally a UI exercise; it does not create searches or fake successful matches.


## Impeccable follow-up — 13 September 2026

Applied the installed Impeccable 4.3.1 skill's Operate/distill/polish guidance to the existing direction. The context launcher could not initialize its engine; a temporary-cache engine download also failed. No automated Impeccable detector results are claimed.

The four-step matching wizard is now three steps: subject, time, and place. Optional language, study-style, and distance controls remain in an expandable preferences section. Replaced the oversized introductory heading, decorative icon container, and wrapping step labels with compact task headings and short numbered steps. Subjects use labeled native radio inputs, with search when there are more than eight subjects. Duration selection announces its active state. Final submission rechecks the current time so an idle form cannot rely on an earlier validation result.

The application and local preview now share a header. Privacy preferences open from a labeled header control on those two surfaces; the floating control remains available elsewhere. This resolves the previously noted overlap on the study flow. Navigation has one active-state treatment, the font stack favors the platform UI font, and the login removes duplicated branding/decorative text.

Previous four-step validation notes describe the first commit. The follow-up was checked as a three-step flow at 375 × 667, including completion in the non-persistent preview and dark-mode preferences. Physical iOS Safari and authenticated backend journeys remain outside this validation.


## Other-tab rollout — 13 September 2026

Extended the approved mobile direction to Chat, Notes, Venues, and Profile using a shared screen heading, consistent margins and type, and larger action targets. Chat adds local name/subject search and roomier message bubbles, with accessible composer labels. Notes uses readable single-column phone cards, a labeled upload button, a labeled subject filter, and larger like/download/menu targets. Venues replaces the nonfunctional map-placeholder switch with an open-now filter; checked-in venues remain reachable for checkout and are sorted first. Profile opens its calendar first, localizes the calendar, and uses scrollable settings with a correctly selected System theme option.

Removed implicit sample-data fallbacks from live venue lists, profile identity, study statistics, past partners, coupons, and calendar sessions. Empty backend results now remain empty instead of appearing populated by imaginary records. Explicit sample content belongs only in the development preview.

The development preview now covers all tabs, including in-memory sample chat, note cards with backend actions disabled, venue filters with check-ins disabled and realtime subscriptions off, and profile settings with account mutations disabled. Its Empty states control makes the new-account experience inspectable. No real messages or backend records were changed during review.

Validation: final TypeScript check, all 57 existing tests, and the production build passed. Browser inspection covered all four sample tabs at 390 × 844 in dark mode, the open-now filter, and chat detail/composer. Physical iPhone keyboard behavior and authenticated network actions still need device/account testing.
