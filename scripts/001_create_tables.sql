-- 001_create_tables.sql
-- Core schema for Read Partner

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  degree text,
  semester int,
  avatar_color text DEFAULT 'bg-primary',
  subjects text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subjects (
  id serial PRIMARY KEY,
  name text NOT NULL,
  name_en text NOT NULL,
  faculty text NOT NULL
);

CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  occupancy int DEFAULT 0,
  discount int,
  is_open boolean DEFAULT true,
  type text DEFAULT 'library',
  distance float DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id int REFERENCES subjects(id),
  venue_id uuid REFERENCES venues(id),
  duration text,
  planned_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user_b uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_a uuid REFERENCES sessions(id),
  session_b uuid REFERENCES sessions(id),
  subject_id int REFERENCES subjects(id),
  venue_id uuid REFERENCES venues(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  matched_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id),
  text text NOT NULL,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject_id int REFERENCES subjects(id),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  file_url text,
  likes_count int DEFAULT 0,
  downloads_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS note_likes (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, note_id)
);

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES venues(id),
  discount text NOT NULL,
  code text UNIQUE NOT NULL,
  expires_at timestamptz,
  redeemed_at timestamptz
);

CREATE TABLE IF NOT EXISTS occupancy_reports (
  id bigserial PRIMARY KEY,
  venue_id uuid REFERENCES venues(id),
  user_id uuid REFERENCES profiles(id),
  occupancy_pct int NOT NULL,
  reported_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES profiles(id),
  subject_id int REFERENCES subjects(id),
  venue_id uuid REFERENCES venues(id),
  date date DEFAULT CURRENT_DATE,
  duration_hours float DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
