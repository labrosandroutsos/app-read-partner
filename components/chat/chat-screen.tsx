"use client"

import { useState } from "react"
import { ChatList } from "./chat-list"
import { ChatView } from "./chat-view"
import type { ConversationPreview } from "@/lib/types"

interface ChatScreenProps {
  userId: string
  conversations: ConversationPreview[]
}

export function ChatScreen({ userId, conversations }: ChatScreenProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

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
    <ChatList
      conversations={conversations}
      onSelectChat={setSelectedChatId}
    />
  )
}
