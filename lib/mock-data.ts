export interface Student {
  id: string
  name: string
  initials: string
  degree: string
  semester: number
  subjects: string[]
  avatarColor: string
  distance: number
  timeOverlap: number
}

export interface Subject {
  id: string
  name: string
  nameEn: string
  faculty: string
}

export interface Venue {
  id: string
  name: string
  address: string
  occupancy: number
  discount: number | null
  isOpen: boolean
  type: "library" | "cafe" | "reading-room"
  distance: number
}

export interface Message {
  id: string
  senderId: string
  text: string
  timestamp: string
  isSystem?: boolean
}

export interface Conversation {
  id: string
  partnerId: string
  subject: string
  venue: string
  messages: Message[]
  unread: number
  lastActive: string
}

export interface Note {
  id: string
  title: string
  subject: string
  authorId: string
  authorName: string
  likes: number
  downloads: number
  color: string
  liked?: boolean
}

export interface Coupon {
  id: string
  venue: string
  discount: string
  expiresAt: string
  code: string
}

export interface StudySession {
  id: string
  date: string
  subject: string
  partnerId: string
  venue: string
  duration: number
}

export interface SubjectStat {
  subject: string
  hours: number
  color: string
}

export const subjects: Subject[] = [
  { id: "s1", name: "Χημεία II", nameEn: "Chemistry II", faculty: "Θετικές Επιστήμες" },
  { id: "s2", name: "Φυσική I", nameEn: "Physics I", faculty: "Θετικές Επιστήμες" },
  { id: "s3", name: "Εισαγωγή στην Πληροφορική", nameEn: "Intro to CS", faculty: "Πληροφορική" },
  { id: "s4", name: "Μαθηματική Ανάλυση", nameEn: "Calculus", faculty: "Μαθηματικά" },
  { id: "s5", name: "Γραμμική Άλγεβρα", nameEn: "Linear Algebra", faculty: "Μαθηματικά" },
  { id: "s6", name: "Οργανική Χημεία", nameEn: "Organic Chemistry", faculty: "Θετικές Επιστήμες" },
  { id: "s7", name: "Αλγόριθμοι", nameEn: "Algorithms", faculty: "Πληροφορική" },
  { id: "s8", name: "Μηχανική", nameEn: "Mechanics", faculty: "Μηχανολογία" },
  { id: "s9", name: "Ηλεκτρονική", nameEn: "Electronics", faculty: "Ηλεκτρολογία" },
  { id: "s10", name: "Βιολογία Κυττάρου", nameEn: "Cell Biology", faculty: "Βιολογία" },
  { id: "s11", name: "Στατιστική", nameEn: "Statistics", faculty: "Μαθηματικά" },
  { id: "s12", name: "Δομές Δεδομένων", nameEn: "Data Structures", faculty: "Πληροφορική" },
  { id: "s13", name: "Θερμοδυναμική", nameEn: "Thermodynamics", faculty: "Θετικές Επιστήμες" },
  { id: "s14", name: "Μικροοικονομική", nameEn: "Microeconomics", faculty: "Οικονομικά" },
  { id: "s15", name: "Βάσεις Δεδομένων", nameEn: "Databases", faculty: "Πληροφορική" },
]

const avatarColors = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500",
  "bg-amber-500", "bg-cyan-500", "bg-fuchsia-500", "bg-lime-500",
  "bg-orange-500", "bg-teal-500",
]

export const students: Student[] = [
  { id: "u1", name: "Μαρία Παπαδοπούλου", initials: "ΜΠ", degree: "Χημεία", semester: 4, subjects: ["s1", "s6", "s13"], avatarColor: avatarColors[0], distance: 0.8, timeOverlap: 85 },
  { id: "u2", name: "Γιώργος Νικολάου", initials: "ΓΝ", degree: "Πληροφορική", semester: 6, subjects: ["s3", "s7", "s12"], avatarColor: avatarColors[1], distance: 1.2, timeOverlap: 70 },
  { id: "u3", name: "Ελένη Κωστοπούλου", initials: "ΕΚ", degree: "Μαθηματικά", semester: 3, subjects: ["s4", "s5", "s11"], avatarColor: avatarColors[2], distance: 0.5, timeOverlap: 90 },
  { id: "u4", name: "Δημήτρης Αθανασίου", initials: "ΔΑ", degree: "Φυσική", semester: 5, subjects: ["s2", "s4", "s13"], avatarColor: avatarColors[3], distance: 2.1, timeOverlap: 60 },
  { id: "u5", name: "Σοφία Βασιλείου", initials: "ΣΒ", degree: "Βιολογία", semester: 2, subjects: ["s10", "s1", "s11"], avatarColor: avatarColors[4], distance: 1.5, timeOverlap: 75 },
  { id: "u6", name: "Κώστας Μακρής", initials: "ΚΜ", degree: "Ηλεκτρολογία", semester: 7, subjects: ["s9", "s3", "s8"], avatarColor: avatarColors[5], distance: 0.3, timeOverlap: 95 },
  { id: "u7", name: "Αθηνά Γεωργίου", initials: "ΑΓ", degree: "Οικονομικά", semester: 4, subjects: ["s14", "s11", "s4"], avatarColor: avatarColors[6], distance: 3.0, timeOverlap: 50 },
  { id: "u8", name: "Νίκος Πετρίδης", initials: "ΝΠ", degree: "Μηχανολογία", semester: 6, subjects: ["s8", "s2", "s13"], avatarColor: avatarColors[7], distance: 1.8, timeOverlap: 65 },
  { id: "u9", name: "Κατερίνα Λαζάρου", initials: "ΚΛ", degree: "Πληροφορική", semester: 3, subjects: ["s3", "s12", "s15"], avatarColor: avatarColors[8], distance: 0.9, timeOverlap: 80 },
  { id: "u10", name: "Αλέξανδρος Ρούσσος", initials: "ΑΡ", degree: "Χημεία", semester: 5, subjects: ["s1", "s6", "s10"], avatarColor: avatarColors[9], distance: 1.1, timeOverlap: 72 },
]

export const currentUser: Student = {
  id: "me",
  name: "Αντώνης Δημητρίου",
  initials: "ΑΔ",
  degree: "Πληροφορική",
  semester: 4,
  subjects: ["s3", "s7", "s12", "s15"],
  avatarColor: "bg-primary",
  distance: 0,
  timeOverlap: 100,
}

export const venues: Venue[] = [
  { id: "v1", name: "Βιβλιοθήκη Πανεπιστημίου", address: "Ρίο, Πανεπιστημιούπολη", occupancy: 72, discount: null, isOpen: true, type: "library", distance: 0.5 },
  { id: "v2", name: "Coffee Lab", address: "Μαιζώνος 45, Πάτρα", occupancy: 45, discount: 15, isOpen: true, type: "cafe", distance: 1.2 },
  { id: "v3", name: "Αναγνωστήριο ΑΤΕΙ", address: "Κουκούλι, Πάτρα", occupancy: 88, discount: null, isOpen: true, type: "reading-room", distance: 2.0 },
  { id: "v4", name: "Brew & Study", address: "Κολοκοτρώνη 12, Πάτρα", occupancy: 30, discount: 20, isOpen: true, type: "cafe", distance: 0.8 },
  { id: "v5", name: "Δημοτική Βιβλιοθήκη", address: "Παντανάσσης 10, Πάτρα", occupancy: 95, discount: null, isOpen: false, type: "library", distance: 3.0 },
]

export const conversations: Conversation[] = [
  {
    id: "c1",
    partnerId: "u1",
    subject: "Χημεία II",
    venue: "Coffee Lab",
    unread: 2,
    lastActive: "14:32",
    messages: [
      { id: "m1", senderId: "system", text: "chat.session.started", timestamp: "13:00", isSystem: true },
      { id: "m2", senderId: "u1", text: "Γεια! Είσαι έτοιμος για μελέτη;", timestamp: "13:05" },
      { id: "m3", senderId: "me", text: "Ναι! Ξεκινάμε από κεφάλαιο 5;", timestamp: "13:07" },
      { id: "m4", senderId: "u1", text: "Τέλεια, φέρνω και τις σημειώσεις μου", timestamp: "13:10" },
      { id: "m5", senderId: "u1", text: "Θα πάρω και καφέ, θέλεις κάτι;", timestamp: "14:30" },
      { id: "m6", senderId: "u1", text: "Ελπίζω να προλάβουμε και κεφάλαιο 6!", timestamp: "14:32" },
    ],
  },
  {
    id: "c2",
    partnerId: "u3",
    subject: "Μαθηματική Ανάλυση",
    venue: "Βιβλιοθήκη",
    unread: 0,
    lastActive: "Χθες",
    messages: [
      { id: "m7", senderId: "me", text: "Σε ευχαριστώ για τη βοήθεια!", timestamp: "18:00" },
      { id: "m8", senderId: "u3", text: "Τίποτα! Ήταν παραγωγικό!", timestamp: "18:05" },
      { id: "m9", senderId: "system", text: "chat.session.ended", timestamp: "18:10", isSystem: true },
      { id: "m10", senderId: "u3", text: "Την Τετάρτη ξανά;", timestamp: "20:00" },
    ],
  },
  {
    id: "c3",
    partnerId: "u6",
    subject: "Εισαγωγή στην Πληροφορική",
    venue: "Brew & Study",
    unread: 1,
    lastActive: "10:15",
    messages: [
      { id: "m11", senderId: "u6", text: "Πρέπει να δουλέψουμε τα recursion problems", timestamp: "09:30" },
      { id: "m12", senderId: "me", text: "Σύμφωνος. Αύριο στις 3;", timestamp: "09:45" },
      { id: "m13", senderId: "u6", text: "Deal! Θα φέρω και laptop", timestamp: "10:15" },
    ],
  },
]

export const notes: Note[] = [
  { id: "n1", title: "Χημεία II - Κεφ. 1-5 Περίληψη", subject: "s1", authorId: "u1", authorName: "Μαρία Π.", likes: 34, downloads: 120, color: "bg-blue-100 dark:bg-blue-900/30" },
  { id: "n2", title: "Αλγόριθμοι - Ταξινόμηση", subject: "s7", authorId: "u2", authorName: "Γιώργος Ν.", likes: 56, downloads: 200, color: "bg-emerald-100 dark:bg-emerald-900/30" },
  { id: "n3", title: "Ανάλυση - Ολοκληρώματα", subject: "s4", authorId: "u3", authorName: "Ελένη Κ.", likes: 45, downloads: 180, color: "bg-violet-100 dark:bg-violet-900/30" },
  { id: "n4", title: "Φυσική I - Μηχανική", subject: "s2", authorId: "u4", authorName: "Δημήτρης Α.", likes: 23, downloads: 90, color: "bg-rose-100 dark:bg-rose-900/30" },
  { id: "n5", title: "Δομές Δεδομένων Cheatsheet", subject: "s12", authorId: "u9", authorName: "Κατερίνα Λ.", likes: 78, downloads: 310, color: "bg-amber-100 dark:bg-amber-900/30" },
  { id: "n6", title: "Γραμμική Άλγεβρα - Πίνακες", subject: "s5", authorId: "u3", authorName: "Ελένη Κ.", likes: 41, downloads: 155, color: "bg-cyan-100 dark:bg-cyan-900/30" },
  { id: "n7", title: "Βάσεις Δεδομένων - SQL", subject: "s15", authorId: "u2", authorName: "Γιώργος Ν.", likes: 62, downloads: 240, color: "bg-fuchsia-100 dark:bg-fuchsia-900/30" },
  { id: "n8", title: "Οργανική Χημεία - Αντιδράσεις", subject: "s6", authorId: "u10", authorName: "Αλέξανδρος Ρ.", likes: 29, downloads: 105, color: "bg-lime-100 dark:bg-lime-900/30" },
  { id: "n9", title: "Στατιστική - Πιθανότητες", subject: "s11", authorId: "u7", authorName: "Αθηνά Γ.", likes: 38, downloads: 142, color: "bg-orange-100 dark:bg-orange-900/30" },
  { id: "n10", title: "Εισαγωγή Πληροφορική - Python", subject: "s3", authorId: "u6", authorName: "Κώστας Μ.", likes: 91, downloads: 380, color: "bg-teal-100 dark:bg-teal-900/30" },
]

export const coupons: Coupon[] = [
  { id: "cp1", venue: "Coffee Lab", discount: "-15%", expiresAt: "2026-03-15", code: "STUDY15" },
  { id: "cp2", venue: "Brew & Study", discount: "-20%", expiresAt: "2026-04-01", code: "READ20" },
  { id: "cp3", venue: "Coffee Lab", discount: "1 Free Coffee", expiresAt: "2026-03-30", code: "FREECOF" },
  { id: "cp4", venue: "Brew & Study", discount: "-10%", expiresAt: "2026-05-15", code: "BREW10" },
]

export const studySessions: StudySession[] = [
  { id: "ss1", date: "2026-02-28", subject: "Χημεία II", partnerId: "u1", venue: "Coffee Lab", duration: 3 },
  { id: "ss2", date: "2026-03-02", subject: "Αλγόριθμοι", partnerId: "u6", venue: "Brew & Study", duration: 2 },
  { id: "ss3", date: "2026-03-04", subject: "Μαθηματική Ανάλυση", partnerId: "u3", venue: "Βιβλιοθήκη", duration: 4 },
  { id: "ss4", date: "2026-03-07", subject: "Βάσεις Δεδομένων", partnerId: "u9", venue: "Coffee Lab", duration: 2 },
]

export const subjectStats: SubjectStat[] = [
  { subject: "Εισαγωγή στην Πληροφορική", hours: 24, color: "hsl(210, 70%, 55%)" },
  { subject: "Αλγόριθμοι", hours: 18, color: "hsl(150, 60%, 45%)" },
  { subject: "Δομές Δεδομένων", hours: 15, color: "hsl(280, 60%, 55%)" },
  { subject: "Βάσεις Δεδομένων", hours: 10, color: "hsl(35, 85%, 55%)" },
]

export const pastPartners = [
  { studentId: "u1", sessions: 8 },
  { studentId: "u3", sessions: 5 },
  { studentId: "u6", sessions: 12 },
  { studentId: "u9", sessions: 3 },
  { studentId: "u2", sessions: 6 },
]

export function getStudentById(id: string): Student | undefined {
  if (id === "me") return currentUser
  return students.find((s) => s.id === id)
}

export function getSubjectById(id: string): Subject | undefined {
  return subjects.find((s) => s.id === id)
}
