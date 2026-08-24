"use client"

import { useRouter } from "next/navigation"
import { ChatList } from "./chat-list"
import { ChatView } from "./chat-view"
import { markConversationRead } from "@/lib/actions"
import type { ConversationPreview, Venue } from "@/lib/types"

interface ChatScreenProps {
  userId: string
  conversations: ConversationPreview[]
  venues: Venue[]
  selectedChatId: string | null
  onSelectedChatIdChange: (matchId: string | null) => void
}

export function ChatScreen({ userId, conversations, venues, selectedChatId, onSelectedChatIdChange }: ChatScreenProps) {
  const router = useRouter()

  const handleSelectChat = (matchId: string) => {
    onSelectedChatIdChange(matchId)
    void markConversationRead(matchId)
      .then(() => router.refresh())
      .catch(() => undefined)
  }

  const selectedConv = conversations.find(c => c.match.id === selectedChatId)
  if (selectedConv) {
    return (
      <ChatView
        matchId={selectedConv.match.id}
        partner={selectedConv.partner}
        subject={selectedConv.subject}
        venue={selectedConv.venue}
        userId={userId}
        venues={venues}
        schedule={selectedConv.schedule}
        onBack={() => onSelectedChatIdChange(null)}
      />
    )
  }

  return (
    <ChatList conversations={conversations} onSelectChat={handleSelectChat} />
  )
}
