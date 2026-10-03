export interface Profile {
  department_id?: string | null
  curriculum_id?: string | null
  entry_year?: number | null
  id: string
  display_name: string | null
  degree: string | null
  semester: number | null
  avatar_color: string | null
  subjects: string[]
  created_at: string
}

export interface CourseOffering {
  semester: number
  track: number
  kind: string
  ects: number | null
  page: number
  other_tracks_only?: boolean
}

export interface Subject {
  department_id?: string | null
  course_code?: string | null
  offerings?: CourseOffering[]
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
  subject_id: number | null
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
  status: 'pending' | 'accepted' | 'declined' | 'ended'
  matched_at: string
  user_a_last_read_at: string | null
  user_b_last_read_at: string | null
  ended_at: string | null
  ended_by: string | null
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

export interface VenueCheckin {
  id: string
  venue_id: string
  user_id: string
  checked_in_at: string
  checked_out_at: string | null
}

export interface VenueManagerDashboardData {
  assignmentId: string
  venue: Venue
  activeCheckins: number
  upcomingSessions: Pick<StudySessionRecord, 'id' | 'starts_at' | 'ends_at' | 'status' | 'duration_hours'>[]
  recentCheckins: Pick<VenueCheckin, 'id' | 'checked_in_at' | 'checked_out_at'>[]
  occupancyHistory: Pick<OccupancyReport, 'id' | 'occupancy_pct' | 'reported_at'>[]
}

export type AppRole = 'moderator' | 'admin'

export interface ActiveSuspension {
  id: string
  user_id: string
  reason: string
  suspended_by: string
  suspended_at: string
  suspended_until: string | null
  lifted_at: string | null
  user?: Pick<Profile, 'id' | 'display_name' | 'avatar_color'>
  actor?: Pick<Profile, 'id' | 'display_name'>
}

export interface AccessContext {
  role: AppRole | null
  suspension: ActiveSuspension | null
}

export type NotificationType = 'interest' | 'match' | 'message' | 'schedule_proposal'

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  actor_id: string | null
  match_id: string | null
  source_id: string
  payload: Record<string, unknown>
  read_at: string | null
  created_at: string
  actor?: Pick<Profile, 'id' | 'display_name' | 'avatar_color'> | null
}

export interface ModerationNoteReport {
  id: string
  reporter_id: string
  note_id: string
  reason: string
  details: string | null
  status: 'open' | 'reviewed' | 'dismissed'
  created_at: string
  reporter?: Pick<Profile, 'id' | 'display_name' | 'avatar_color'>
  note?: Pick<Note, 'id' | 'title' | 'author_id' | 'moderation_status'> & {
    author?: Pick<Profile, 'id' | 'display_name' | 'avatar_color'>
  }
}

export interface ModerationUserReport {
  id: string
  reporter_id: string
  reported_id: string
  reason: string
  details: string | null
  status: 'open' | 'reviewed' | 'dismissed'
  created_at: string
  reporter?: Pick<Profile, 'id' | 'display_name' | 'avatar_color'>
  reported?: Pick<Profile, 'id' | 'display_name' | 'avatar_color'>
}

export interface ModerationDashboardData {
  role: AppRole
  noteReports: ModerationNoteReport[]
  userReports: ModerationUserReport[]
  activeSuspensions: ActiveSuspension[]
}

export interface AdminAccount {
  profile: Profile
  role: AppRole | null
  managedVenueId: string | null
}

export interface ModerationAuditEntry {
  id: number
  actor_id: string
  action: string
  target_type: string
  target_id: string | null
  details: Record<string, unknown>
  created_at: string
  actor?: Pick<Profile, 'id' | 'display_name'>
}

export interface AdminDashboardData extends ModerationDashboardData {
  accounts: AdminAccount[]
  venues: Venue[]
  settings: Record<string, unknown>
  auditLog: ModerationAuditEntry[]
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

export interface MatchingSearchFeedback {
  activeMatchCount: number
  pendingInterestCount: number
  searchExpiresAt: string | null
}

export interface MatchingSearchResult {
  candidates: PartnerCandidate[]
  feedback: MatchingSearchFeedback
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
