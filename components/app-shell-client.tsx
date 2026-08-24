"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { BookOpen, Moon, Sun } from "lucide-react"
import { BottomTabBar, type TabId } from "@/components/bottom-tab-bar"
import { LanguageToggle } from "@/components/language-toggle"
import { PartnerScreen } from "@/components/partner/partner-screen"
import { ChatScreen } from "@/components/chat/chat-screen"
import { NotesScreen } from "@/components/notes/notes-screen"
import { VenuesScreen } from "@/components/venues/venues-screen"
import { ProfileScreen } from "@/components/profile/profile-screen"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { Button } from "@/components/ui/button"
import { markConversationRead } from "@/lib/actions"
import type { Profile, Subject, Venue, Note, Coupon, StudySessionRecord, ConversationPreview, BlockedUser, AppNotification } from "@/lib/types"

interface AppShellClientProps {
  userId: string
  email: string
  authProvider: string
  profile: Profile | null
  subjects: Subject[]
  venues: Venue[]
  conversations: ConversationPreview[]
  notes: Note[]
  coupons: Coupon[]
  studySessions: StudySessionRecord[]
  studyStats: { subject: string; hours: number }[]
  pastPartners: { profile: Profile; sessions: number }[]
  blockedUsers: BlockedUser[]
  activeVenueId: string | null
  notifications: AppNotification[]
}

export function AppShellClient({
  userId,
  email,
  authProvider,
  profile,
  subjects,
  venues,
  conversations,
  notes,
  coupons,
  studySessions,
  studyStats,
  pastPartners,
  blockedUsers,
  activeVenueId,
  notifications,
}: AppShellClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("partner")
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const unreadChats = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  const handleGoToChat = () => setActiveTab("chat")
  const handleNotificationChat = (matchId: string) => {
    setSelectedChatId(matchId)
    setActiveTab("chat")
    void markConversationRead(matchId).then(() => router.refresh(), () => router.refresh())
  }
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    if (tab !== "chat") setSelectedChatId(null)
  }

  return (
    <div className="mx-auto max-w-[430px] min-h-dvh bg-background relative flex flex-col">
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-base text-foreground tracking-tight">Read Partner</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationCenter
            userId={userId}
            initialNotifications={notifications}
            activeMatchId={activeTab === "chat" ? selectedChatId : null}
            onOpenChat={handleNotificationChat}
          />
          <LanguageToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {mounted ? (
              resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
            ) : (
              <span className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === "partner" && (
          <PartnerScreen
            onGoToChat={handleGoToChat}
            userId={userId}
            profile={profile}
            subjects={subjects}
            venues={venues}
          />
        )}
        {activeTab === "chat" && (
          <ChatScreen
            userId={userId}
            conversations={conversations}
            venues={venues}
            selectedChatId={selectedChatId}
            onSelectedChatIdChange={setSelectedChatId}
          />
        )}
        {activeTab === "notes" && (
          <NotesScreen
            userId={userId}
            notes={notes}
            subjects={subjects}
          />
        )}
        {activeTab === "venues" && (
          <VenuesScreen venues={venues} initialActiveVenueId={activeVenueId} />
        )}
        {activeTab === "profile" && (
          <ProfileScreen
            userId={userId}
            email={email}
            authProvider={authProvider}
            profile={profile}
            studyStats={studyStats}
            pastPartners={pastPartners}
            blockedUsers={blockedUsers}
            coupons={coupons}
            studySessions={studySessions}
            subjects={subjects}
            venues={venues}
          />
        )}
      </main>

      <BottomTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        unreadChats={unreadChats}
      />
    </div>
  )
}
