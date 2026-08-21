"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChatList } from "./chat-list"
import { ChatView } from "./chat-view"
import { markConversationRead } from "@/lib/actions"
import type { ConversationPreview } from "@/lib/types"

interface ChatScreenProps {
  userId: string
  conversations: ConversationPreview[]
}

export function ChatScreen({ userId, conversations }: ChatScreenProps) {
  const router = useRouter()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

  const handleSelectChat = (matchId: string) => {
    setSelectedChatId(matchId)
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
        onBack={() => setSelectedChatId(null)}
      />
    )
  }

  return (
    <ChatList conversations={conversations} onSelectChat={handleSelectChat} />
  )
}
