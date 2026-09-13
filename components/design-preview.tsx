"use client"

import { useState } from "react"
import { DailyWizard } from "@/components/partner/daily-wizard"
import { BottomTabBar, type TabId } from "@/components/bottom-tab-bar"
import { StudyHeader } from "@/components/study-header"
import { ChatList } from "@/components/chat/chat-list"
import { ChatView } from "@/components/chat/chat-view"
import { NotesScreen } from "@/components/notes/notes-screen"
import { VenuesScreen } from "@/components/venues/venues-screen"
import { ProfileScreen } from "@/components/profile/profile-screen"
import { conversations as sampleChats, venues as sourceVenues } from "@/lib/mock-data"
import type { Note, Profile, Subject, Venue } from "@/lib/types"
import { Button } from "@/components/ui/button"

const sampleSubjects: Subject[] = [
  { id: 1, faculty: "Demo", name: "Μαθηματικά", name_en: "Mathematics" },
  { id: 2, faculty: "Demo", name: "Πληροφορική", name_en: "Computer Science" },
  { id: 3, faculty: "Demo", name: "Βιολογία", name_en: "Biology" },
  { id: 4, faculty: "Demo", name: "Οικονομικά", name_en: "Economics" },
  { id: 5, faculty: "Demo", name: "Φυσική", name_en: "Physics" },
  { id: 6, faculty: "Demo", name: "Ψυχολογία", name_en: "Psychology" },
]
const sampleProfile: Profile = { id: "preview", display_name: "Ελένη · Demo", degree: "Μαθηματικά", semester: 4, avatar_color: "bg-primary", subjects: [], created_at: "2026-09-01" }
const sampleVenues: Venue[] = sourceVenues.map(({ isOpen, ...venue }) => ({ ...venue, is_open: isOpen }))
const sampleNotes: Note[] = [
  { id: "preview-note-1", title: "Παράγωγοι & ολοκληρώματα — βασικοί τύποι", subject_id: 1, author_id: "preview", file_url: null, likes_count: 12, downloads_count: 24, created_at: "2026-09-01", subject: sampleSubjects[0], author: sampleProfile },
  { id: "preview-note-2", title: "Δομές δεδομένων: επανάληψη εξεταστικής", subject_id: 2, author_id: "preview", file_url: null, likes_count: 8, downloads_count: 16, created_at: "2026-09-01", subject: sampleSubjects[1], author: sampleProfile },
]

// Explicit, local-only fixtures. Backend mutations are disabled in sample tabs.
export function DesignPreview() {
  const [tab, setTab] = useState<TabId>("partner")
  const [complete, setComplete] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [empty, setEmpty] = useState(false)
  const selectedChat = !empty && sampleChats.find((chat) => chat.id === chatId)
  return <div className="relative mx-auto flex h-dvh max-w-[760px] flex-col overflow-hidden border-x bg-background">
    <StudyHeader />
    <div className="flex shrink-0 items-center justify-between px-5 py-1 text-[11px] text-muted-foreground"><span>Preview · sample data · nothing saved</span><Button variant="ghost" className="h-11 text-xs" aria-pressed={empty} onClick={() => setEmpty(!empty)}>{empty ? "Show samples" : "Empty states"}</Button></div>
    <main className="min-h-0 flex-1 overflow-y-auto pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
      <div hidden={tab !== "partner"}>
        {complete ? <div className="space-y-4 p-6"><h1 className="text-2xl font-semibold">You’re ready to find a partner.</h1><p>This preview stops before matchmaking. No search was created.</p><Button onClick={() => setComplete(false)}>Try again</Button></div> : <DailyWizard subjects={empty ? [] : sampleSubjects} onComplete={() => setComplete(true)} />}
      </div>
      {tab === "chat" && (selectedChat ? <ChatView key={selectedChat.id} userId="preview" mockConversation={selectedChat} onBack={() => setChatId(null)} /> : <ChatList mockConversations={empty ? [] : sampleChats} onSelectChat={setChatId} />)}
      {tab === "notes" && <NotesScreen preview notes={empty ? [] : sampleNotes} subjects={sampleSubjects} />}
      {tab === "venues" && <VenuesScreen preview venues={empty ? [] : sampleVenues} />}
      {tab === "profile" && <ProfileScreen preview userId="preview" email="" authProvider="email" profile={empty ? null : sampleProfile} studyStats={empty ? [] : [{subject:"Μαθηματικά",hours:6},{subject:"Πληροφορική",hours:3}]} pastPartners={[]} coupons={[]} studySessions={[]} subjects={sampleSubjects} venues={sampleVenues} blockedUsers={[]} />}
    </main>
    <BottomTabBar activeTab={tab} onTabChange={(next) => {setTab(next); setChatId(null)}} unreadChats={0} unreadInterests={0} />
  </div>
}
