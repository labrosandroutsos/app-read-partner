-- Requires 020 and 021. Department membership is independent of catalogue coverage.
BEGIN;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS campus text;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS source_url text;
INSERT INTO public.departments(id,university_id,name,campus,source_url) VALUES
('upatras-biology','upatras','Βιολογίας','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-natural-sciences/department-of-biology/'),
('upatras-geology','upatras','Γεωλογίας','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-natural-sciences/department-of-geology/'),
('upatras-materials-science','upatras','Επιστήμης των Υλικών','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-natural-sciences/department-of-materials-science/'),
('upatras-mathematics','upatras','Μαθηματικών','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-natural-sciences/department-of-mathematics/'),
('upatras-physics','upatras','Φυσικής','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-natural-sciences/department-of-physics/'),
('upatras-chemistry','upatras','Χημείας','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-natural-sciences/department-of-chemistry/'),
('upatras-architecture','upatras','Αρχιτεκτόνων Μηχανικών','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-engineering/department-of-architecture/'),
('upatras-electrical-and-computer-engineering','upatras','Ηλεκτρολόγων Μηχανικών και Τεχνολογίας Υπολογιστών','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-engineering/department-of-electrical-and-computer-engineering/'),
('upatras-computer-engineering-and-informatics','upatras','Μηχανικών Ηλεκτρονικών Υπολογιστών και Πληροφορικής','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-engineering/department-of-computer-engineering-and-informatics/'),
('upatras-mechanical-engineering-and-aeronautics','upatras','Μηχανολόγων και Αεροναυπηγών Μηχανικών','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-engineering/department-of-mechanical-engineering-and-aeronautics/'),
('upatras-civil','upatras','Πολιτικών Μηχανικών','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-engineering/department-of-civil-engineering/'),
('upatras-chemical-engineering','upatras','Χημικών Μηχανικών','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-engineering/department-of-chemical-engineering/'),
('upatras-medicine','upatras','Ιατρικής','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-health-sciences/department-of-medicine/'),
('upatras-pharmacy','upatras','Φαρμακευτικής','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-health-sciences/department-of-pharmacy/'),
('upatras-education-and-social-work','upatras','Επιστημών της Εκπαίδευσης και Κοινωνικής Εργασίας','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-humanities-and-social-sciences/department-of-education-and-social-work/'),
('upatras-educational-sciences-and-early-childhood-education','upatras','Επιστημών της Εκπαίδευσης και της Αγωγής στην Προσχολική Ηλικία','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-humanities-and-social-sciences/department-of-educational-sciences-and-early-childhood-education/'),
('upatras-theatre-studies','upatras','Θεατρικών Σπουδών','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-humanities-and-social-sciences/department-of-theatre-studies/'),
('upatras-history-and-archaeology','upatras','Ιστορίας-Αρχαιολογίας','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-humanities-and-social-sciences/department-of-history-and-archaeology/'),
('upatras-philology','upatras','Φιλολογίας','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-humanities-and-social-sciences/department-of-philology/'),
('upatras-philosophy','upatras','Φιλοσοφίας','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-humanities-and-social-sciences/department-of-philosophy/'),
('upatras-business-administration','upatras','Διοίκησης Επιχειρήσεων','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-economics-and-business/department-of-business-administration/'),
('upatras-tourism-management','upatras','Διοίκησης Τουρισμού','Πάτρα (Κουκούλι)','https://www.upatras.gr/education/undergraduate-studies/school-of-economics-and-business/department-of-tourism-management/'),
('upatras-management-science-and-technology','upatras','Διοικητικής Επιστήμης και Τεχνολογίας','Πάτρα (Κουκούλι)','https://www.upatras.gr/education/undergraduate-studies/school-of-economics-and-business/department-of-management-science-and-technology/'),
('upatras-economics','upatras','Οικονομικών Επιστημών','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-economics-and-business/department-of-economics/'),
('upatras-sustainable-agriculture','upatras','Αειφορικής Γεωργίας','Αγρίνιο','https://www.upatras.gr/education/undergraduate-studies/school-of-agricultural-sciences/department-of-sustainable-agriculture/'),
('upatras-fisheries-and-aquaculture','upatras','Αλιείας και Υδατοκαλλιεργειών','Μεσολόγγι','https://www.upatras.gr/education/undergraduate-studies/school-of-agricultural-sciences/department-of-fisheries-and-aquaculture/'),
('upatras-agriculture','upatras','Γεωπονίας','Μεσολόγγι','https://www.upatras.gr/education/undergraduate-studies/school-of-agricultural-sciences/department-of-agriculture/'),
('upatras-food-science-and-technology','upatras','Επιστήμης και Τεχνολογίας Τροφίμων','Αγρίνιο','https://www.upatras.gr/education/undergraduate-studies/school-of-agricultural-sciences/department-of-food-science-and-technology/'),
('upatras-speech-and-language-therapy','upatras','Λογοθεραπείας','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-health-rehabilitation-sciences/department-of-speech-and-language-therapy/'),
('upatras-nursing','upatras','Νοσηλευτικής','Πάτρα (Κουκούλι)','https://www.upatras.gr/education/undergraduate-studies/school-of-health-rehabilitation-sciences/department-of-nursing/'),
('upatras-physiotherapy','upatras','Φυσικοθεραπείας','Πάτρα','https://www.upatras.gr/education/undergraduate-studies/school-of-health-rehabilitation-sciences/department-of-physiotherapy/')
ON CONFLICT(id) DO UPDATE SET name=excluded.name,campus=excluded.campus,source_url=excluded.source_url;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_curriculum_department_fk;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_curriculum_department_fk
 FOREIGN KEY(curriculum_id,department_id) REFERENCES public.curricula(id,department_id) MATCH SIMPLE;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_curriculum_requires_department;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_curriculum_requires_department CHECK(curriculum_id IS NULL OR department_id IS NOT NULL);

-- Null subject_id means both students explicitly chose general study.
-- Department city is a coarse campus boundary, not GPS-based distance.
CREATE OR REPLACE FUNCTION private.same_study_community(a uuid,b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS(
 SELECT 1 FROM public.profiles pa JOIN public.departments da ON da.id=pa.department_id
 CROSS JOIN public.profiles pb JOIN public.departments db ON db.id=pb.department_id
 WHERE pa.id=a AND pb.id=b AND da.university_id=db.university_id
 AND split_part(da.campus,' (',1)=split_part(db.campus,' (',1)
 );
$$;
REVOKE ALL ON FUNCTION private.same_study_community(uuid,uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION private.validate_general_study_session()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NEW.subject_id IS NULL AND NOT private.same_study_community(NEW.user_id,NEW.user_id) THEN
  RAISE EXCEPTION 'Choose your department before general study matching';
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.validate_general_study_session() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS validate_general_study_session ON public.sessions;
CREATE TRIGGER validate_general_study_session BEFORE INSERT OR UPDATE OF subject_id,user_id ON public.sessions
FOR EACH ROW EXECUTE FUNCTION private.validate_general_study_session();

CREATE OR REPLACE FUNCTION private.validate_general_study_match()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NEW.subject_id IS NULL AND NEW.status IN ('pending','accepted') THEN
  IF NOT private.same_study_community(NEW.user_a,NEW.user_b) OR NOT EXISTS(
    SELECT 1 FROM public.sessions a JOIN public.sessions b ON b.id=NEW.session_b
    WHERE a.id=NEW.session_a AND a.user_id=NEW.user_a AND b.user_id=NEW.user_b
    AND a.subject_id IS NULL AND b.subject_id IS NULL
  ) THEN RAISE EXCEPTION 'General study requires compatible searches from both students'; END IF;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.validate_general_study_match() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS validate_general_study_match ON public.matches;
CREATE TRIGGER validate_general_study_match BEFORE INSERT OR UPDATE OF subject_id,session_a,session_b,user_a,user_b,status ON public.matches
FOR EACH ROW EXECUTE FUNCTION private.validate_general_study_match();
CREATE OR REPLACE FUNCTION private.find_match_candidates_core(p_session_id uuid)
RETURNS TABLE (
  candidate_user_id uuid,
  candidate_session_id uuid,
  display_name text,
  degree text,
  semester integer,
  subjects text[],
  avatar_color text,
  distance double precision,
  planned_start timestamptz,
  planned_end timestamptz,
  study_style text,
  language text,
  venue_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_session public.sessions%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF public.is_current_user_venue_manager() THEN RAISE EXCEPTION 'Student account required'; END IF;

  SELECT * INTO v_session
  FROM public.sessions
  WHERE id = p_session_id AND user_id = v_user
    AND status = 'active' AND expires_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Search session not found'; END IF;

  RETURN QUERY
  SELECT
    p.id,
    s.id,
    p.display_name,
    p.degree,
    p.semester,
    p.subjects,
    p.avatar_color,
    COALESCE(v.distance, 0)::double precision,
    s.planned_start,
    s.planned_end,
    s.study_style,
    s.language,
    s.venue_id
  FROM public.sessions s
  JOIN public.profiles p ON p.id = s.user_id
  LEFT JOIN public.venues v ON v.id = s.venue_id
  WHERE s.user_id <> v_user
    AND s.subject_id IS NOT DISTINCT FROM v_session.subject_id
    AND (v_session.subject_id IS NOT NULL OR private.same_study_community(v_user,s.user_id))
    AND s.planned_date = v_session.planned_date
    AND s.status = 'active'
    AND s.expires_at > now()
    AND s.planned_start < v_session.planned_end
    AND s.planned_end > v_session.planned_start
    AND COALESCE(v.distance, 0) <= COALESCE(v_session.max_distance_km, 5)
    AND NOT EXISTS (SELECT 1 FROM public.venue_managers vm WHERE vm.user_id = s.user_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks b
      WHERE (b.blocker_id = v_user AND b.blocked_id = s.user_id)
         OR (b.blocker_id = s.user_id AND b.blocked_id = v_user)
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.matches m
      WHERE ((m.user_a = v_user AND m.user_b = s.user_id) OR (m.user_a = s.user_id AND m.user_b = v_user))
        AND (
          m.status = 'accepted'
          OR (m.status = 'pending' AND m.user_a = v_user)
        )
    )
  ORDER BY s.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION private.find_match_candidates_core(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.find_match_candidates_core(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.swipe_on_session(
  p_session_id uuid,
  p_candidate_session_id uuid
)
RETURNS TABLE (match_id uuid, matched boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_session public.sessions%ROWTYPE;
  v_candidate public.sessions%ROWTYPE;
  v_match public.matches%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_session FROM public.sessions
  WHERE id = p_session_id AND user_id = v_user_id
    AND status = 'active' AND expires_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Search session not found'; END IF;

  SELECT * INTO v_candidate FROM public.sessions
  WHERE id = p_candidate_session_id AND user_id <> v_user_id
    AND status = 'active' AND expires_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Candidate session not found'; END IF;
  IF v_session.subject_id IS DISTINCT FROM v_candidate.subject_id THEN RAISE EXCEPTION 'Candidate subject is incompatible'; END IF;
  IF v_session.subject_id IS NULL AND NOT private.same_study_community(v_user_id,v_candidate.user_id) THEN RAISE EXCEPTION 'Candidate university or campus is incompatible'; END IF;
  IF v_session.planned_start >= v_candidate.planned_end OR v_candidate.planned_start >= v_session.planned_end THEN
    RAISE EXCEPTION 'Candidate availability does not overlap';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = v_user_id AND blocked_id = v_candidate.user_id)
       OR (blocker_id = v_candidate.user_id AND blocked_id = v_user_id)
  ) THEN RAISE EXCEPTION 'Candidate unavailable'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    LEAST(v_user_id::text, v_candidate.user_id::text) || ':' || GREATEST(v_user_id::text, v_candidate.user_id::text), 0
  ));

  SELECT * INTO v_match FROM public.matches
  WHERE status = 'accepted' AND ((user_a = v_user_id AND user_b = v_candidate.user_id) OR (user_a = v_candidate.user_id AND user_b = v_user_id))
  ORDER BY matched_at DESC LIMIT 1;
  IF FOUND THEN RETURN QUERY SELECT v_match.id, true; RETURN; END IF;

  SELECT * INTO v_match FROM public.matches
  WHERE user_a = v_candidate.user_id AND user_b = v_user_id AND status = 'pending'
    AND session_a = v_candidate.id AND subject_id IS NOT DISTINCT FROM v_session.subject_id
  ORDER BY matched_at DESC LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    UPDATE public.matches SET
      status = 'accepted', session_b = v_session.id, subject_id = v_session.subject_id,
      venue_id = CASE WHEN v_session.venue_id = v_candidate.venue_id THEN v_session.venue_id ELSE COALESCE(v_session.venue_id, v_candidate.venue_id) END,
      matched_at = now(), user_a_last_read_at = now(), user_b_last_read_at = now()
    WHERE id = v_match.id;
    UPDATE public.sessions SET status = 'matched' WHERE id IN (v_session.id, v_candidate.id);
    INSERT INTO public.messages(match_id, sender_id, text, is_system) VALUES (v_match.id, NULL, 'chat.match.confirmed', true);
    RETURN QUERY SELECT v_match.id, true; RETURN;
  END IF;

  SELECT * INTO v_match FROM public.matches
  WHERE user_a = v_user_id AND user_b = v_candidate.user_id AND status = 'pending'
  ORDER BY matched_at DESC LIMIT 1;
  IF FOUND THEN RETURN QUERY SELECT v_match.id, false; RETURN; END IF;

  INSERT INTO public.matches(user_a, user_b, session_a, session_b, subject_id, venue_id, status)
  VALUES (
    v_user_id, v_candidate.user_id, v_session.id, v_candidate.id, v_session.subject_id,
    CASE WHEN v_session.venue_id = v_candidate.venue_id THEN v_session.venue_id ELSE COALESCE(v_session.venue_id, v_candidate.venue_id) END,
    'pending'
  ) RETURNING * INTO v_match;
  RETURN QUERY SELECT v_match.id, false;
END;
$$;
REVOKE ALL ON FUNCTION public.swipe_on_session(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.swipe_on_session(uuid,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.general_study_matching_ready()
RETURNS boolean LANGUAGE sql STABLE SET search_path = '' AS $$ SELECT true $$;
REVOKE ALL ON FUNCTION public.general_study_matching_ready() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.general_study_matching_ready() TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
