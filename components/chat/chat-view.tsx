"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Send, MapPin, Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { sendMessage } from "@/lib/actions"
import { useRealtimeMessages } from "@/hooks/use-realtime-messages"
import { useRealtimeSchedule } from "@/hooks/use-realtime-schedule"
import { toast } from "sonner"
import type { Conversation, Message as MockMessage } from "@/lib/mock-data"
import { getStudentById } from "@/lib/mock-data"
import type { Profile, StudySessionRecord, Subject, Venue } from "@/lib/types"
import { UserSafetyMenu } from "@/components/safety/user-safety-menu"
import { ScheduleSessionDialog } from "@/components/calendar/schedule-session-dialog"
import { StudyProposalCard } from "@/components/chat/study-proposal-card"

interface ChatViewProps {
  matchId?: string
  partner?: Profile
  subject?: Subject | null
  venue?: Venue | null
  userId: string
  onBack: () => void
  mockConversation?: Conversation
  venues?: Venue[]
  schedule?: StudySessionRecord | null
}

export function ChatView({ matchId, partner, subject, venue, userId, onBack, mockConversation, venues = [], schedule = null }: ChatViewProps) {
  const { t, locale } = useTranslation()
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [pendingQuickAction, setPendingQuickAction] = useState<string | null>(null)
  const sendingRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Real-time messages for DB conversations
  const { messages: realtimeMessages, appendMessage } = useRealtimeMessages(matchId ?? null, userId)
  const liveSchedule = useRealtimeSchedule(matchId ?? null, schedule)

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
    const message = input.trim()
    if (!message || sendingRef.current) return

    sendingRef.current = true
    setIsSending(true)
    setInput("")

    try {
      if (isReal && matchId) {
        const sent = await sendMessage(matchId, message)
        appendMessage(sent)
      } else {
        const newMsg: MockMessage = {
          id: `msg-${Date.now()}`,
          senderId: "me",
          text: message,
          timestamp: new Date().toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" }),
        }
        setMockMessages((prev) => [...prev, newMsg])
      }
    } catch {
      setInput((current) => current || message)
      toast.error(t("chat.send.error"))
    } finally {
      sendingRef.current = false
      setIsSending(false)
    }
  }

  const handleQuickAction = async (key: string, text: string) => {
    if (sendingRef.current) return

    sendingRef.current = true
    setIsSending(true)
    setPendingQuickAction(key)

    try {
      if (isReal && matchId) {
        const sent = await sendMessage(matchId, text)
        appendMessage(sent)
      } else {
        const newMsg: MockMessage = {
          id: `msg-${Date.now()}`,
          senderId: "me",
          text,
          timestamp: new Date().toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" }),
        }
        setMockMessages((prev) => [...prev, newMsg])
      }
    } catch {
      toast.error(t("chat.send.error"))
    } finally {
      sendingRef.current = false
      setIsSending(false)
      setPendingQuickAction(null)
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-3 py-2">
        <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={onBack} aria-label={locale === "el" ? "Πίσω στις συνομιλίες" : "Back to conversations"}>
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
        {isReal && matchId && partner && (
          <ScheduleSessionDialog matchId={matchId} currentUserId={userId} partnerName={displayName} venues={venues} schedule={liveSchedule} />
        )}
        {isReal && partner && (
          <UserSafetyMenu
            targetUserId={partner.id}
            targetName={displayName}
            matchId={matchId}
            onBlocked={onBack}
            onMatchEnded={onBack}
          />
        )}
      </div>

      {isReal && matchId && liveSchedule && (liveSchedule.status === "proposed" || liveSchedule.status === "confirmed") && (
        <StudyProposalCard matchId={matchId} currentUserId={userId} partnerName={displayName} subjectName={displaySubject} venues={venues} schedule={liveSchedule} />
      )}

      <ScrollArea className="min-h-0 flex-1 px-4 py-3" ref={scrollRef}>
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
              <div key={msg.id} className={cn("flex duration-200 animate-in fade-in slide-in-from-bottom-1", msg.isMine ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[82%] break-words rounded-[20px] px-4 py-2.5 text-[15px] leading-6 shadow-sm",
                  msg.isMine
                    ? "rounded-br-md bg-[linear-gradient(160deg,var(--primary-cta),var(--primary-cta-strong))] text-primary-foreground"
                    : "rounded-bl-md border border-border bg-card text-foreground"
                )}>
                  <p>{msg.text}</p>
                  <p className={cn("mt-1 text-[10px]", msg.isMine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <div className="flex shrink-0 items-center gap-2 overflow-x-auto px-4 py-2">
        {quickActions.map((action) => (
          <Button
            key={action.key}
            variant="outline"
            size="sm"
            className="shrink-0 text-xs rounded-full h-11"
            onClick={() => handleQuickAction(action.key, action.label)}
            disabled={isSending}
          >
            {pendingQuickAction === action.key && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {action.label}
          </Button>
        ))}
      </div>

      <div className="glass-surface flex shrink-0 items-center gap-2 border-t border-border/70 px-4 py-3">
        <Input
          aria-label={t("chat.input.placeholder")}
          placeholder={t("chat.input.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault()
              void handleSend()
            }
          }}
          className="h-12 flex-1 rounded-full bg-card px-4"
          disabled={isSending}
        />
        <Button aria-label={locale === "el" ? "Αποστολή μηνύματος" : "Send message"} size="icon" className="h-12 w-12 shrink-0 rounded-full" onClick={handleSend} disabled={!input.trim() || isSending}>
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
