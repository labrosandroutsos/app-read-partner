-- Additive catalogue pilot. Existing generic subjects and their references are preserved.
BEGIN;
CREATE TABLE IF NOT EXISTS public.departments (
 id text PRIMARY KEY, university_id text NOT NULL, name text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.curricula (
 id text PRIMARY KEY, department_id text NOT NULL REFERENCES public.departments(id),
 label text NOT NULL, entry_year_min integer NOT NULL, entry_year_max integer NOT NULL,
 source jsonb NOT NULL, UNIQUE (id,department_id), CHECK(entry_year_max >= entry_year_min)
);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS department_id text REFERENCES public.departments(id);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS course_code text;
CREATE UNIQUE INDEX IF NOT EXISTS subjects_department_code ON public.subjects(department_id,course_code);
CREATE TABLE IF NOT EXISTS public.curriculum_courses (
 curriculum_id text NOT NULL REFERENCES public.curricula(id),
 subject_id integer NOT NULL REFERENCES public.subjects(id),
 offerings jsonb NOT NULL CHECK(jsonb_typeof(offerings)='array'),
 PRIMARY KEY(curriculum_id,subject_id)
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department_id text REFERENCES public.departments(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS curriculum_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS entry_year integer CHECK(entry_year BETWEEN 1950 AND 2100);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='profiles_curriculum_department_fk') THEN
 ALTER TABLE public.profiles ADD CONSTRAINT profiles_curriculum_department_fk
 FOREIGN KEY(curriculum_id,department_id) REFERENCES public.curricula(id,department_id) MATCH FULL;
 END IF;
END $$;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS catalogue_read ON public.departments;
CREATE POLICY catalogue_read ON public.departments FOR SELECT TO authenticated USING(true);
DROP POLICY IF EXISTS catalogue_read ON public.curricula;
CREATE POLICY catalogue_read ON public.curricula FOR SELECT TO authenticated USING(true);
DROP POLICY IF EXISTS catalogue_read ON public.curriculum_courses;
CREATE POLICY catalogue_read ON public.curriculum_courses FOR SELECT TO authenticated USING(true);
GRANT SELECT ON public.departments,public.curricula,public.curriculum_courses TO authenticated;
REVOKE ALL ON public.departments,public.curricula,public.curriculum_courses FROM anon;
REVOKE INSERT,UPDATE,DELETE ON public.departments,public.curricula,public.curriculum_courses FROM authenticated;
COMMIT;
