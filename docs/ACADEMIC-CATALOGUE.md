# Civil Engineering catalogue pilot

Status: implemented locally on the design branch. Production Supabase migrations have **not** been applied. Preview: `/catalogue-preview` in development only; linked from `/design-preview`.

## Source and scope

University of Patras, Department of Civil Engineering, undergraduate study guide 2026–27, programme Π3. Official landing page: https://www.civil.upatras.gr/index.php/odhgos/ . The precise PDF URL, retrieval date, SHA-256, source course codes and individual printed page numbers are recorded in `data/catalogues/upatras-civil-2026.json`.

Extracted with `pdftotext -layout`; curriculum tables on pp. 13–28 were reviewed against the text, with the first and last table pages also rendered for visual inspection. Page 10 identifies Π3 as the programme for entry cohorts 2014–15 onward. This snapshot accepts entry years 2014–2026. Π2 and earlier curricula are not included.

The JSON contains 105 distinct source codes and 133 semester/track offerings. Of these, 78 actual courses are selectable. The other 27 entries (24 generic external-elective slots, internship, and two thesis entries) remain in the source data for traceability but are not seeded as matching subjects. Core semester credit totals reconcile to 30 ECTS for semesters 1–7 and 20 common-core ECTS in semester 8.

Greek and Latin A suffixes are normalised for identity; each offering retains its original code. Shared courses have one subject identity across semesters and tracks. The semester-10 restriction on taking certain courses from other tracks is retained. Course titles remain official Greek titles in either interface language; no unverified translations were invented.

This is a searchable study/notes catalogue, **not** an enrolment eligibility or degree-audit system. Students can access all semesters for retakes. Tracks and restrictions are preserved in data and shown in the catalogue preview, but the live study picker does not enforce track eligibility. Prior names/equivalences, prerequisite rules, external-department elective selections and older curricula still need separate review. A new guide must be reviewed before a future academic-year import; there is no automatic scraping or exam-calendar inference.

## App behaviour

After the catalogue is available, students without an assigned curriculum see university, department, entry-year and current-semester selection after sign-in. Unsupported programmes can continue with general subjects for that visit; no Civil Engineering assignment is fabricated. Profile → studies reopens selection. Students entering semester 11 or beyond see all course semesters by default.

Notes browsing, uploads and study matching use the same subject IDs, with semester filters. Greek search ignores accents and accepts either alphabet's A in codes. Existing accounts without a curriculum retain the original subject behaviour. Existing notes and sessions are preserved; old generic notes are not automatically reclassified into official courses, and the departmental notes feed shows only its catalogue. Existing chats remain available.

## Activation

In the project's Supabase SQL editor, run in order:

1. `scripts/020_academic_catalogue.sql`
2. `scripts/021_seed_civil_catalogue.sql`

Both are transactional and additive. The app falls back to existing subject handling until the catalogue is seeded. New catalogue tables are read-only to authenticated users and unavailable to anonymous clients. Profile writes continue through existing own-profile RLS. No service key is required by the app.

Check that `curriculum_courses` has 78 rows for `upatras-civil-p3-2026`, then verify authenticated profile saving, note uploading and study matching against the real backend. These live integration checks remain pending. The new local preview cannot save profiles or create searches.

Regenerate the seed after reviewing JSON changes with `node scripts/generate-civil-catalogue.mjs`. Do not renumber existing subjects, overwrite generic subjects by title, or delete old curriculum versions. Seed reruns preserve matching subject IDs and refresh offering metadata.

## Validation performed

- 83 Vitest tests pass, including catalogue identities, semester credits, exclusions, restrictions, Greek search and selection validation.
- TypeScript and production build passed.
- Schema and seed executed twice in temporary PGlite PostgreSQL with a representative existing subject and linked note. Verified 78 catalogue subjects, stable subject IDs, preserved note reference, authenticated read-only access, anonymous denial and composite profile foreign key.
- Browser preview at 390 × 844: onboarding, Greek search, semester notes filtering and course selection through the study wizard. This is responsive-browser verification, not a new physical-iPhone test.

Local PostgreSQL verification does not replace testing the migrations against the complete deployed Supabase schema, its triggers and grants.
