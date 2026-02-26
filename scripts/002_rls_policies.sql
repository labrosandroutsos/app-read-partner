-- 002_rls_policies.sql
-- Row Level Security policies

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupancy_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = id);

-- subjects (public read)
CREATE POLICY "Subjects are viewable by everyone" ON subjects FOR SELECT USING (true);

-- venues (public read)
CREATE POLICY "Venues are viewable by everyone" ON venues FOR SELECT USING (true);

-- sessions
CREATE POLICY "Sessions are viewable by everyone for matching" ON sessions FOR SELECT USING (true);
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON sessions FOR DELETE USING (auth.uid() = user_id);

-- matches
CREATE POLICY "Users can view matches they are part of" ON matches FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "Users can create matches they are part of" ON matches FOR INSERT WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "Users can update matches they are part of" ON matches FOR UPDATE USING (auth.uid() = user_a OR auth.uid() = user_b);

-- messages
CREATE POLICY "Users can view messages for their matches" ON messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM matches WHERE matches.id = messages.match_id AND (matches.user_a = auth.uid() OR matches.user_b = auth.uid())));
CREATE POLICY "Users can send messages as themselves" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- notes
CREATE POLICY "Notes are viewable by everyone" ON notes FOR SELECT USING (true);
CREATE POLICY "Users can insert own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = author_id);

-- note_likes
CREATE POLICY "Note likes are viewable by everyone" ON note_likes FOR SELECT USING (true);
CREATE POLICY "Users can like notes" ON note_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike notes" ON note_likes FOR DELETE USING (auth.uid() = user_id);

-- coupons
CREATE POLICY "Users can view own coupons" ON coupons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own coupons" ON coupons FOR UPDATE USING (auth.uid() = user_id);

-- occupancy_reports
CREATE POLICY "Occupancy reports are viewable by everyone" ON occupancy_reports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can report" ON occupancy_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- study_sessions
CREATE POLICY "Users can view own sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);
CREATE POLICY "Users can insert own sessions" ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
