"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { BookOpen, Moon, Sun } from "lucide-react"
import { BottomTabBar, type TabId } from "@/components/bottom-tab-bar"
import { LanguageToggle } from "@/components/language-toggle"
import { PartnerScreen } from "@/components/partner/partner-screen"
import { ChatScreen } from "@/components/chat/chat-screen"
import { NotesScreen } from "@/components/notes/notes-screen"
import { VenuesScreen } from "@/components/venues/venues-screen"
import { ProfileScreen } from "@/components/profile/profile-screen"
import { Button } from "@/components/ui/button"
import type { Profile, Subject, Venue, Note, Coupon, StudySessionRecord, ConversationPreview } from "@/lib/types"

interface AppShellClientProps {
  userId: string
  profile: Profile | null
  subjects: Subject[]
  venues: Venue[]
  conversations: ConversationPreview[]
  notes: Note[]
  coupons: Coupon[]
  studySessions: StudySessionRecord[]
  studyStats: { subject: string; hours: number }[]
  pastPartners: { profile: Profile; sessions: number }[]
}

export function AppShellClient({
  userId,
  profile,
  subjects,
  venues,
  conversations,
  notes,
  coupons,
  studySessions,
  studyStats,
  pastPartners,
}: AppShellClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("partner")
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const unreadChats = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  const handleGoToChat = () => setActiveTab("chat")

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
          <VenuesScreen venues={venues} />
        )}
        {activeTab === "profile" && (
          <ProfileScreen
            userId={userId}
            profile={profile}
            studyStats={studyStats}
            pastPartners={pastPartners}
            coupons={coupons}
            studySessions={studySessions}
            subjects={subjects}
            venues={venues}
          />
        )}
      </main>

      <BottomTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadChats={unreadChats}
      />
    </div>
  )
}
