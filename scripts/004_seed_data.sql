-- 004_seed_data.sql
-- Seed subjects and venues

INSERT INTO subjects (name, name_en, faculty) VALUES
  ('Χημεία II', 'Chemistry II', 'Θετικές Επιστήμες'),
  ('Φυσική I', 'Physics I', 'Θετικές Επιστήμες'),
  ('Εισαγωγή στην Πληροφορική', 'Intro to CS', 'Πληροφορική'),
  ('Μαθηματική Ανάλυση', 'Calculus', 'Μαθηματικά'),
  ('Γραμμική Άλγεβρα', 'Linear Algebra', 'Μαθηματικά'),
  ('Οργανική Χημεία', 'Organic Chemistry', 'Θετικές Επιστήμες'),
  ('Αλγόριθμοι', 'Algorithms', 'Πληροφορική'),
  ('Μηχανική', 'Mechanics', 'Μηχανολογία'),
  ('Ηλεκτρονική', 'Electronics', 'Ηλεκτρολογία'),
  ('Βιολογία Κυττάρου', 'Cell Biology', 'Βιολογία'),
  ('Στατιστική', 'Statistics', 'Μαθηματικά'),
  ('Δομές Δεδομένων', 'Data Structures', 'Πληροφορική'),
  ('Θερμοδυναμική', 'Thermodynamics', 'Θετικές Επιστήμες'),
  ('Μικροοικονομική', 'Microeconomics', 'Οικονομικά'),
  ('Βάσεις Δεδομένων', 'Databases', 'Πληροφορική')
ON CONFLICT DO NOTHING;

INSERT INTO venues (name, address, occupancy, discount, is_open, type, distance) VALUES
  ('Βιβλιοθήκη Πανεπιστημίου', 'Ρίο, Πανεπιστημιούπολη', 72, NULL, true, 'library', 0.5),
  ('Coffee Lab', 'Μαιζώνος 45, Πάτρα', 45, 15, true, 'cafe', 1.2),
  ('Αναγνωστήριο ΑΤΕΙ', 'Κουκούλι, Πάτρα', 88, NULL, true, 'reading-room', 2.0),
  ('Brew & Study', 'Κολοκοτρώνη 12, Πάτρα', 30, 20, true, 'cafe', 0.8),
  ('Δημοτική Βιβλιοθήκη', 'Παντανάσσης 10, Πάτρα', 95, NULL, false, 'library', 3.0);
