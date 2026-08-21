"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Send, MapPin } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { sendMessage } from "@/lib/actions"
import { useRealtimeMessages } from "@/hooks/use-realtime-messages"
import { toast } from "sonner"
import type { Conversation, Message as MockMessage } from "@/lib/mock-data"
import { getStudentById } from "@/lib/mock-data"
import type { Profile, Subject, Venue } from "@/lib/types"

interface ChatViewProps {
  matchId?: string
  partner?: Profile
  subject?: Subject | null
  venue?: Venue | null
  userId: string
  onBack: () => void
  mockConversation?: Conversation
}

export function ChatView({ matchId, partner, subject, venue, userId, onBack, mockConversation }: ChatViewProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Real-time messages for DB conversations
  const realtimeMessages = useRealtimeMessages(matchId ?? null, userId)

  // Mock fallback
  const mockPartner = mockConversation ? getStudentById(mockConversation.partnerId) : null
  const [mockMessages, setMockMessages] = useState<MockMessage[]>(mockConversation?.messages ?? [])

  const isReal = !!matchId && !!partner
  const displayName = isReal ? (partner.display_name || 'Student') : (mockPartner?.name || '')
  const displayInitials = isReal ? (partner.display_name || 'S').slice(0, 2).toUpperCase() : (mockPartner?.initials || '')
  const displayColor = isReal ? (partner.avatar_color || 'bg-blue-500') : (mockPartner?.avatarColor || 'bg-blue-500')
  const displaySubject = isReal ? (subject?.name || '') : (mockConversation?.subject || '')
  const displayVenue = isReal ? (venue?.name || '') : (mockConversation?.venue || '')

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [realtimeMessages, mockMessages])

  const handleSend = async () => {
    if (!input.trim()) return

    if (isReal && matchId) {
      try {
        await sendMessage(matchId, input.trim())
        setInput("")
      } catch {
        toast.error(t("chat.send.error"))
      }
    } else {
      const newMsg: MockMessage = {
        id: `msg-${Date.now()}`,
        senderId: "me",
        text: input.trim(),
        timestamp: new Date().toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" }),
      }
      setMockMessages((prev) => [...prev, newMsg])
      setInput("")
    }
  }

  const handleQuickAction = async (text: string) => {
    if (isReal && matchId) {
      try {
        await sendMessage(matchId, text)
      } catch {
        toast.error(t("chat.send.error"))
      }
    } else {
      const newMsg: MockMessage = {
        id: `msg-${Date.now()}`,
        senderId: "me",
        text,
        timestamp: new Date().toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" }),
      }
      setMockMessages((prev) => [...prev, newMsg])
    }
  }

  const quickActions = [
    { key: "chat.quick.onmyway", label: t("chat.quick.onmyway") },
    { key: "chat.quick.late", label: t("chat.quick.late") },
    { key: "chat.quick.arrived", label: t("chat.quick.arrived") },
  ]

  // Build message list
  const messageItems = isReal
    ? realtimeMessages.map(m => ({
        id: m.id,
        isMine: m.sender_id === userId,
        isSystem: m.is_system,
        text: m.is_system ? t(m.text as Parameters<typeof t>[0]) : m.text,
        timestamp: new Date(m.created_at).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" }),
      }))
    : mockMessages.map(m => ({
        id: m.id,
        isMine: m.senderId === "me",
        isSystem: m.isSystem ?? false,
        text: m.isSystem ? t(m.text as Parameters<typeof t>[0]) : m.text,
        timestamp: m.timestamp,
      }))

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-card">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", displayColor)}>
          {displayInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{displayName}</p>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">{displaySubject}</Badge>
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {displayVenue}
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
        <div className="flex flex-col gap-2">
          {messageItems.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                    {msg.text}
                  </span>
                </div>
              )
            }
            return (
              <div key={msg.id} className={cn("flex", msg.isMine ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm",
                  msg.isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}>
                  <p>{msg.text}</p>
                  <p className={cn("text-[10px] mt-1", msg.isMine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
        {quickActions.map((action) => (
          <Button
            key={action.key}
            variant="outline"
            size="sm"
            className="shrink-0 text-xs rounded-full h-7"
            onClick={() => handleQuickAction(action.label)}
          >
            {action.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-card">
        <Input
          placeholder={t("chat.input.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1"
        />
        <Button size="icon" className="shrink-0 h-10 w-10 rounded-full" onClick={handleSend} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
