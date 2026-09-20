"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BottomTabBar, type TabId } from "@/components/bottom-tab-bar"
import { StudyHeader } from "@/components/study-header"
import { PartnerScreen } from "@/components/partner/partner-screen"
import { ChatScreen } from "@/components/chat/chat-screen"
import { NotesScreen } from "@/components/notes/notes-screen"
import { VenuesScreen } from "@/components/venues/venues-screen"
import { ProfileScreen } from "@/components/profile/profile-screen"
import { ContextualNotifications } from "@/components/notifications/contextual-notifications"
import { markConversationRead, markNotificationsRead } from "@/lib/actions"
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
  const [unreadInterestIds, setUnreadInterestIds] = useState<string[]>(() => notifications
    .filter((notification) => notification.type === "interest" && !notification.read_at)
    .map((notification) => notification.id))
  const router = useRouter()

  useEffect(() => {
    setUnreadByMatch(Object.fromEntries(
      conversations.map((conversation) => [conversation.match.id, conversation.unreadCount]),
    ))
  }, [conversations])

  useEffect(() => {
    setUnreadInterestIds(notifications
      .filter((notification) => notification.type === "interest" && !notification.read_at)
      .map((notification) => notification.id))
  }, [notifications])

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
  const handleNotificationPartner = (notificationId: string) => {
    setUnreadInterestIds((current) => current.filter((id) => id !== notificationId))
    setSelectedChatId(null)
    setActiveTab("partner")
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
    if (notification.type === "interest" && !notification.read_at) {
      setUnreadInterestIds((current) => current.includes(notification.id) ? current : [...current, notification.id])
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
    if (tab === "partner" && unreadInterestIds.length > 0) {
      const notificationIds = unreadInterestIds
      setUnreadInterestIds([])
      for (const notificationId of notificationIds) void markNotificationsRead(notificationId).catch(() => undefined)
    }
  }

  return (
    <div className="relative mx-auto flex h-dvh max-w-[760px] border-x border-border shadow-sm flex-col overflow-hidden bg-background">
      <ContextualNotifications
        userId={userId}
        initialNotifications={notifications}
        activeMatchId={activeTab === "chat" ? selectedChatId : null}
        onOpenChat={handleNotificationChat}
        onOpenPartner={handleNotificationPartner}
        onIncomingActivity={handleIncomingActivity}
      />
      <StudyHeader />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div hidden={activeTab !== "partner"} className="min-h-full">
          <PartnerScreen
            onGoToChat={handleGoToChat}
            userId={userId}
            profile={profile}
            subjects={subjects}
            venues={venues}
          />
        </div>
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
        unreadInterests={unreadInterestIds.length}
      />
    </div>
  )
}
