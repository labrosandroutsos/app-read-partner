// Isolated PostgreSQL integration test. Pass the path to PGlite's dist/index.js.
// npm install --prefix /tmp/readpartner-sql-check @electric-sql/pglite
// node scripts/verify-general-study.mjs /tmp/readpartner-sql-check/node_modules/@electric-sql/pglite/dist/index.js
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
const { PGlite } = await import(pathToFileURL(process.argv[2]).href)
const db = new PGlite()
const sql = (name) => readFileSync(new URL(name, import.meta.url), 'utf8')
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE SCHEMA private;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION public.is_current_user_venue_manager() RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;`)
await db.exec(sql('001_create_tables.sql'))
await db.exec(`ALTER TABLE matches ADD COLUMN user_a_last_read_at timestamptz,ADD COLUMN user_b_last_read_at timestamptz;
CREATE TABLE user_blocks(blocker_id uuid,blocked_id uuid);
CREATE TABLE venue_managers(user_id uuid);
INSERT INTO subjects(name,name_en,faculty) VALUES('Legacy','Legacy','General');
INSERT INTO notes(title,subject_id) VALUES('Preserve me',1);`)
await db.exec(sql('009_matchmaking_and_scheduling.sql'))
for (const file of [
  '020_academic_catalogue.sql',
  '021_seed_civil_catalogue.sql',
  '022_departments_and_general_study.sql',
  '023_seed_physics_catalogue.sql',
])
  await db.exec(sql(file))
const idsBefore = (
  await db.query('SELECT id,course_code FROM subjects ORDER BY id')
).rows
for (const file of [
  '022_departments_and_general_study.sql',
  '023_seed_physics_catalogue.sql',
])
  await db.exec(sql(file))
assert.deepEqual(
  (await db.query('SELECT id,course_code FROM subjects ORDER BY id')).rows,
  idsBefore,
)
assert.equal(
  (await db.query('SELECT count(*)::int AS n FROM departments')).rows[0].n,
  31,
)
assert.equal(
  (await db.query('SELECT count(*)::int AS n FROM curriculum_courses')).rows[0]
    .n,
  158,
)
assert.equal(
  (await db.query('SELECT subject_id FROM notes')).rows[0].subject_id,
  1,
)
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const uid = (n) => id(n),
  sid = (n) => id(n + 100)
const auth = async (n) =>
  db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [uid(n)])
for (let n = 1; n <= 9; n++) {
  await db.query('INSERT INTO auth.users VALUES($1)', [uid(n)])
  await db.query(
    'INSERT INTO profiles(id,display_name,department_id,semester) VALUES($1,$2,$3,1)',
    [
      uid(n),
      `Student ${n}`,
      n === 5
        ? 'upatras-agriculture'
        : n === 2
          ? 'upatras-physics'
          : n === 9
            ? null
            : 'upatras-civil',
    ],
  )
}
for (let n = 1; n <= 8; n++)
  await db.query(
    `INSERT INTO sessions(id,user_id,subject_id,planned_date,planned_start,planned_end,expires_at,status)
 VALUES($1,$2,$3,current_date,now()+interval '1 hour',now()+interval '3 hours',now()+interval '3 hours','active')`,
    [sid(n), uid(n), [3, 4].includes(n) ? 1 : null],
  )
await db.query('INSERT INTO user_blocks VALUES($1,$2)', [uid(1), uid(6)])
await db.query(
  "UPDATE sessions SET expires_at=now()-interval '1 hour' WHERE id=$1",
  [sid(7)],
)
await db.query(
  "UPDATE sessions SET planned_start=now()+interval '4 hours',planned_end=now()+interval '5 hours' WHERE id=$1",
  [sid(8)],
)
await assert.rejects(
  db.query('INSERT INTO sessions(user_id,subject_id) VALUES($1,null)', [
    uid(9),
  ]),
  /Choose your department/,
)
await auth(1)
assert.deepEqual(
  (
    await db.query(
      'SELECT candidate_user_id FROM private.find_match_candidates_core($1)',
      [sid(1)],
    )
  ).rows.map((r) => r.candidate_user_id),
  [uid(2)],
)
await assert.rejects(
  db.query('SELECT * FROM swipe_on_session($1,$2)', [sid(1), sid(3)]),
  /subject is incompatible/,
)
await assert.rejects(
  db.query('SELECT * FROM swipe_on_session($1,$2)', [sid(1), sid(5)]),
  /campus is incompatible/,
)
await assert.rejects(
  db.query('SELECT * FROM swipe_on_session($1,$2)', [sid(1), sid(6)]),
  /unavailable/,
)
assert.equal(
  (await db.query('SELECT * FROM swipe_on_session($1,$2)', [sid(1), sid(2)]))
    .rows[0].matched,
  false,
)
await auth(2)
const matched = (
  await db.query('SELECT * FROM swipe_on_session($1,$2)', [sid(2), sid(1)])
).rows[0]
assert.equal(matched.matched, true)
assert.equal(
  (
    await db.query('SELECT subject_id FROM matches WHERE id=$1', [
      matched.match_id,
    ])
  ).rows[0].subject_id,
  null,
)
const scheduled = await db.query(
  "SELECT propose_study_session($1,now()+interval '1 day',now()+interval '1 day 2 hours',null) AS id",
  [matched.match_id],
)
assert.ok(scheduled.rows[0].id)
await auth(3)
assert.deepEqual(
  (
    await db.query(
      'SELECT candidate_user_id FROM private.find_match_candidates_core($1)',
      [sid(3)],
    )
  ).rows.map((r) => r.candidate_user_id),
  [uid(4)],
)
await db.exec('SET ROLE authenticated')
assert.equal(
  (await db.query('SELECT general_study_matching_ready() AS ready')).rows[0]
    .ready,
  true,
)
await assert.rejects(
  db.exec("UPDATE departments SET name='changed'"),
  /permission denied/,
)
await db.exec('RESET ROLE; SET ROLE anon')
await assert.rejects(
  db.query('SELECT general_study_matching_ready()'),
  /permission denied/,
)
await db.exec('RESET ROLE')
console.log(
  'PASS: 31 departments, 158 courses, rerunnable import, preserved legacy notes, general/course separation, cross-department general matching, campus/block/expiry/availability exclusions, mutual matching and scheduling, role permissions.',
)
await db.close()
