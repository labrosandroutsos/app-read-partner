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
        subject: (el ? c.subject?.name : c.subject?.name_en) || '',
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
      {filtered.length === 0 && <div role="status" className="mx-5 border-t border-border py-8"><MessageCircle className="mb-4 h-7 w-7 text-primary" /><h2 className="text-base font-semibold">{items.length ? (el ? "Δεν βρέθηκε συνομιλία" : "No conversations found") : t("chat.empty")}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{items.length ? (el ? "Δοκίμασε άλλο όνομα ή μάθημα." : "Try another name or subject.") : t("chat.empty.subtitle")}</p></div>}
      <div className="flex flex-col">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectChat(item.id)}
            className="flex items-center gap-3 px-5 py-4 hover:bg-muted/50 transition-colors text-left border-b border-border/50 last:border-0"
          >
            <div className="relative shrink-0">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white", item.avatarColor)}>
                {item.initials}
              </div>
              {item.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center px-1">
                  {item.unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm truncate text-foreground">{item.name}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">{item.lastActive}</span>
              </div>
              <p className={cn("text-sm truncate mt-0.5", item.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                {item.lastMessage || (el ? "Πες ένα γεια και κανονίστε διάβασμα." : "Say hello and plan a study session.")}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {item.incomingProposal && <Badge className="h-4 bg-amber-500/15 px-1.5 py-0 text-[10px] text-amber-700 hover:bg-amber-500/15 dark:text-amber-400">{el ? "Νέα πρόταση μελέτης" : "New study proposal"}</Badge>}
                {item.subject && <span className="text-xs text-primary">{item.subject}</span>}
                {item.venue && <span className="text-xs text-muted-foreground">· {item.venue}</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
