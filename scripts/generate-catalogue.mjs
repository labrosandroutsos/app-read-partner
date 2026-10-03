// Usage: node scripts/generate-catalogue.mjs data/catalogues/FILE.json scripts/OUTPUT.sql
// Input must be a reviewed catalogue. No network access or live database writes.
import { readFileSync, writeFileSync } from 'node:fs'
const [input, output] = process.argv.slice(2)
if (!input || !output)
  throw new Error('Provide catalogue JSON and output SQL paths')
const data = JSON.parse(readFileSync(input, 'utf8'))
if (!data.department?.id || !data.curriculum?.id || !data.courses?.length)
  throw new Error('Invalid catalogue')
if (new Set(data.courses.map((c) => c.code)).size !== data.courses.length)
  throw new Error('Duplicate course code')
const payload = JSON.stringify(data)
if (payload.includes('$catalogue$')) throw new Error('Unsafe SQL delimiter')
writeFileSync(
  output,
  `-- Generated from ${input}; reviewed source metadata is retained in curricula.source.
-- Additive and rerunnable; requires 020 and a seeded department.
BEGIN;
DO $seed$
DECLARE d jsonb := $catalogue$${payload}$catalogue$::jsonb; c jsonb; sid integer;
BEGIN
 INSERT INTO public.curricula(id,department_id,label,entry_year_min,entry_year_max,source)
 VALUES(d#>>'{curriculum,id}',d#>>'{department,id}',d#>>'{curriculum,label}',
 (d#>>'{curriculum,entry_year_min}')::integer,(d#>>'{curriculum,entry_year_max}')::integer,d->'source')
 ON CONFLICT(id) DO UPDATE SET source=excluded.source,label=excluded.label;
 FOR c IN SELECT value FROM jsonb_array_elements(d->'courses') LOOP
  IF (c->>'selectable')::boolean THEN
   INSERT INTO public.subjects(name,name_en,faculty,department_id,course_code)
   VALUES(c->>'name',c->>'name',d#>>'{department,name}',d#>>'{department,id}',c->>'code')
   ON CONFLICT(department_id,course_code) DO UPDATE SET name=excluded.name,name_en=excluded.name_en
   RETURNING id INTO sid;
   INSERT INTO public.curriculum_courses(curriculum_id,subject_id,offerings)
   VALUES(d#>>'{curriculum,id}',sid,c->'offerings')
   ON CONFLICT(curriculum_id,subject_id) DO UPDATE SET offerings=excluded.offerings;
  END IF;
 END LOOP;
END $seed$;
NOTIFY pgrst, 'reload schema';
COMMIT;
`,
)
