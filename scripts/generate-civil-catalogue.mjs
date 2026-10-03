// Generate a deterministic, additive seed. Review the source JSON before running.
import { readFileSync, writeFileSync } from 'node:fs'
const data = JSON.parse(
  readFileSync(
    new URL('../data/catalogues/upatras-civil-2026.json', import.meta.url),
  ),
)
const payload = JSON.stringify(data)
if (payload.includes('$catalogue$'))
  throw new Error('Invalid SQL delimiter in catalogue')
const sql = `-- Generated from data/catalogues/upatras-civil-2026.json. Do not hand-edit.
-- Requires 020_academic_catalogue.sql. Retains all existing subject IDs and notes.
BEGIN;
DO $seed$
DECLARE d jsonb := $catalogue$${payload}$catalogue$::jsonb; c jsonb; sid integer;
BEGIN
 INSERT INTO public.departments(id, university_id, name) VALUES ('upatras-civil', 'upatras', 'Πολιτικών Μηχανικών') ON CONFLICT (id) DO NOTHING;
 INSERT INTO public.curricula(id, department_id, label, entry_year_min, entry_year_max, source)
 VALUES ('upatras-civil-p3-2026','upatras-civil','Π3 · Οδηγός 2026–27',2014,2026,d->'source')
 ON CONFLICT (id) DO UPDATE SET source=excluded.source;
 FOR c IN SELECT value FROM jsonb_array_elements(d->'courses') LOOP
   IF (c->>'selectable')::boolean THEN
     INSERT INTO public.subjects(name,name_en,faculty,department_id,course_code)
     VALUES(c->>'name',c->>'name','Πολιτικών Μηχανικών','upatras-civil',c->>'code')
     ON CONFLICT (department_id,course_code) DO UPDATE SET name=excluded.name
     RETURNING id INTO sid;
     INSERT INTO public.curriculum_courses(curriculum_id,subject_id,offerings)
     VALUES('upatras-civil-p3-2026',sid,c->'offerings')
     ON CONFLICT(curriculum_id,subject_id) DO UPDATE SET offerings=excluded.offerings;
   END IF;
 END LOOP;
END $seed$;
COMMIT;
`
writeFileSync(new URL('./021_seed_civil_catalogue.sql', import.meta.url), sql)
