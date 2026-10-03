"use client"

import { useState } from "react"
import { ScreenHeading } from "@/components/screen-heading"
import { Input } from "@/components/ui/input"
import { MessageCircle, Search } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/lib/mock-data"
import { getStudentById } from "@/lib/mock-data"
import type { ConversationPreview } from "@/lib/types"

interface ChatListProps {
  currentUserId?: string
  conversations?: ConversationPreview[]
  unreadByMatch?: Record<string, number>
  mockConversations?: Conversation[]
  onSelectChat: (id: string) => void
}

export function ChatList({ currentUserId, conversations, unreadByMatch, mockConversations, onSelectChat }: ChatListProps) {
  const { t, locale } = useTranslation()
  const el = locale === "el"
  const [query, setQuery] = useState("")

  const items = conversations && conversations.length > 0
    ? conversations.map(c => ({
        id: c.match.id,
        name: c.partner.display_name || 'Student',
        initials: (c.partner.display_name || 'S').slice(0, 2).toUpperCase(),
        avatarColor: c.partner.avatar_color || 'bg-blue-500',
        unread: unreadByMatch?.[c.match.id] ?? c.unreadCount,
        incomingProposal: c.schedule?.status === "proposed" && c.schedule.proposed_by !== currentUserId,
        lastActive: new Date(c.lastMessage?.created_at || c.match.matched_at).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' }),
        lastMessage: c.lastMessage?.is_system
          ? t(c.lastMessage.text as Parameters<typeof t>[0])
          : c.lastMessage?.text || '',
        isSystem: c.lastMessage?.is_system ?? false,
        subject: (el ? c.subject?.name : c.subject?.name_en) || (el ? 'Παρέα για διάβασμα' : 'Study together'),
        venue: c.venue?.name || '',
      }))
    : (mockConversations || []).map(conv => {
        const partner = getStudentById(conv.partnerId)
        const lastMsg = conv.messages[conv.messages.length - 1]
        return {
          id: conv.id,
          name: partner?.name || '',
          initials: partner?.initials || '',
          avatarColor: partner?.avatarColor || 'bg-blue-500',
          unread: conv.unread,
          incomingProposal: false,
          lastActive: conv.lastActive,
          lastMessage: lastMsg?.isSystem ? t(lastMsg.text as Parameters<typeof t>[0]) : lastMsg?.text || '',
          isSystem: lastMsg?.isSystem ?? false,
          subject: conv.subject,
          venue: conv.venue,
        }
      })

  const filtered = items.filter((item) => `${item.name} ${item.subject}`.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale).trim()))

  return (
    <div className="flex flex-col">
      <ScreenHeading title={t("chat.title")} description={el ? "Μια κουβέντα, ένα πλάνο για διάβασμα." : "A conversation. A plan to study together."} />
      {items.length > 0 && <div className="relative mx-5 mb-5"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input className="h-12 bg-card pl-10" value={query} onChange={(event) => setQuery(event.target.value)} aria-label={el ? "Αναζήτηση συνομιλιών" : "Search conversations"} placeholder={el ? "Όνομα ή μάθημα" : "Name or subject"} /></div>}
      {filtered.length === 0 && <div role="status" className="mx-5 flex flex-col items-center gap-4 py-14 text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent/25 to-primary/10"><MessageCircle className="h-8 w-8 text-primary" /></span><div className="space-y-1"><h2 className="study-title text-xl">{items.length ? (el ? "Δεν βρέθηκε συνομιλία" : "No conversations found") : t("chat.empty")}</h2><p className="max-w-xs text-sm leading-6 text-muted-foreground">{items.length ? (el ? "Δοκίμασε άλλο όνομα ή μάθημα." : "Try another name or subject.") : t("chat.empty.subtitle")}</p></div></div>}
      <div className="flex flex-col gap-1 px-3">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectChat(item.id)}
            className="flex items-center gap-3 rounded-2xl px-2.5 py-3 text-left transition-all duration-150 ease-[var(--ease-out-quint)] hover:bg-secondary active:scale-[0.99]"
          >
            <div className="relative shrink-0">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ring-2 ring-card", item.avatarColor)}>
                {item.initials}
              </div>
              {item.unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground shadow-sm ring-2 ring-card">
                  {item.unread}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="truncate text-[15px] font-semibold text-foreground">{item.name}</span>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground">{item.lastActive}</span>
              </div>
              <p className={cn("mt-0.5 truncate text-sm", item.unread > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
                {item.lastMessage || (el ? "Πες ένα γεια και κανονίστε διάβασμα." : "Say hello and plan a study session.")}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {item.incomingProposal && <Badge className="h-5 bg-accent/18 px-2 py-0 text-[10px] font-semibold text-accent-strong hover:bg-accent/18">{el ? "Νέα πρόταση μελέτης" : "New study proposal"}</Badge>}
                {item.subject && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{item.subject}</span>}
                {item.venue && <span className="text-[11px] text-muted-foreground">· {item.venue}</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
