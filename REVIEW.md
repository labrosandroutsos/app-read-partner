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
