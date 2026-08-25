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
import { ContextualNotifications } from "@/components/notifications/contextual-notifications"
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
  const [unreadByMatch, setUnreadByMatch] = useState<Record<string, number>>(() => Object.fromEntries(
    conversations.map((conversation) => [conversation.match.id, conversation.unreadCount]),
  ))
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setUnreadByMatch(Object.fromEntries(
      conversations.map((conversation) => [conversation.match.id, conversation.unreadCount]),
    ))
  }, [conversations])

  const pendingProposals = conversations.filter((conversation) => (
    conversation.schedule?.status === "proposed"
    && conversation.schedule.proposed_by !== userId
  )).length
  const unreadChats = Object.values(unreadByMatch).reduce((sum, count) => sum + count, 0) + pendingProposals

  const handleGoToChat = () => setActiveTab("chat")
  const handleNotificationChat = (matchId: string) => {
    setUnreadByMatch((current) => ({ ...current, [matchId]: 0 }))
    setSelectedChatId(matchId)
    setActiveTab("chat")
    void markConversationRead(matchId).then(() => router.refresh(), () => router.refresh())
  }
  const handleIncomingActivity = (notification: AppNotification, isActiveChat: boolean) => {
    if (notification.type === "message" && notification.match_id) {
      const matchId = notification.match_id
      setUnreadByMatch((current) => ({
        ...current,
        [matchId]: isActiveChat ? 0 : (current[matchId] ?? 0) + 1,
      }))
      if (isActiveChat) void markConversationRead(matchId).catch(() => undefined)
    }
    router.refresh()
  }
  const handleSelectedChatIdChange = (matchId: string | null) => {
    setSelectedChatId(matchId)
    if (matchId) setUnreadByMatch((current) => ({ ...current, [matchId]: 0 }))
  }
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    if (tab !== "chat") setSelectedChatId(null)
  }

  return (
    <div className="relative mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background">
      <ContextualNotifications
        userId={userId}
        initialNotifications={notifications}
        activeMatchId={activeTab === "chat" ? selectedChatId : null}
        onOpenChat={handleNotificationChat}
        onIncomingActivity={handleIncomingActivity}
      />
      <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-base text-foreground tracking-tight">Read Partner</span>
        </div>
        <div className="flex items-center gap-1">
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

      <main className="min-h-0 flex-1 overflow-y-auto pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
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
            unreadByMatch={unreadByMatch}
            selectedChatId={selectedChatId}
            onSelectedChatIdChange={handleSelectedChatIdChange}
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
