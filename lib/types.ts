export interface Profile {
  id: string
  display_name: string | null
  degree: string | null
  semester: number | null
  avatar_color: string | null
  subjects: string[]
  created_at: string
}

export interface Subject {
  id: number
  name: string
  name_en: string
  faculty: string
}

export interface Venue {
  id: string
  name: string
  address: string | null
  occupancy: number
  discount: number | null
  is_open: boolean
  type: string
  distance: number
}

export interface Session {
  id: string
  user_id: string
  subject_id: number
  venue_id: string | null
  duration: string | null
  planned_date: string
  created_at: string
  planned_start: string | null
  planned_end: string | null
  study_style: 'quiet' | 'social' | 'either'
  language: 'el' | 'en' | 'either'
  max_distance_km: number
  status: 'active' | 'expired' | 'matched' | 'cancelled'
  expires_at: string | null
}

export interface Match {
  id: string
  user_a: string
  user_b: string
  session_a: string | null
  session_b: string | null
  subject_id: number | null
  venue_id: string | null
  status: 'pending' | 'accepted' | 'declined'
  matched_at: string
  user_a_last_read_at: string | null
  user_b_last_read_at: string | null
}

export interface Message {
  id: string
  match_id: string
  sender_id: string | null
  text: string
  is_system: boolean
  created_at: string
}

export interface Note {
  id: string
  title: string
  subject_id: number | null
  author_id: string
  file_url: string | null
  likes_count: number
  downloads_count: number
  created_at: string
  author?: Profile
  subject?: Subject
  liked_by_me?: boolean
  moderation_status?: 'visible' | 'hidden'
}

export interface BlockedUser {
  id: string
  display_name: string | null
  avatar_color: string | null
  blocked_at: string
}

export interface Coupon {
  id: string
  user_id: string
  venue_id: string
  discount: string
  code: string
  expires_at: string | null
  redeemed_at: string | null
  venue?: Venue
}

export interface OccupancyReport {
  id: number
  venue_id: string
  user_id: string
  occupancy_pct: number
  reported_at: string
}

export interface StudySessionRecord {
  id: string
  user_id: string
  partner_id: string | null
  subject_id: number | null
  venue_id: string | null
  date: string
  duration_hours: number
  created_at: string
  match_id: string | null
  starts_at: string | null
  ends_at: string | null
  status: 'proposed' | 'confirmed' | 'cancelled' | 'completed'
  proposed_by: string | null
  accepted_at: string | null
  updated_at: string | null
  partner?: Profile
  owner?: Profile
  subject?: Subject
  venue?: Venue
}

export interface PartnerCandidate {
  id: string
  sessionId: string
  name: string
  initials: string
  degree: string
  semester: number
  subjects: string[]
  avatarColor: string
  distance: number
  timeOverlap: number
  compatibilityScore: number
  compatibilityReasons: string[]
  plannedStart: string | null
  plannedEnd: string | null
  studyStyle: 'quiet' | 'social' | 'either'
  language: 'el' | 'en' | 'either'
}

export interface ConversationPreview {
  match: Match
  partner: Profile
  lastMessage: Message | null
  unreadCount: number
  subject: Subject | null
  venue: Venue | null
  schedule: StudySessionRecord | null
}
