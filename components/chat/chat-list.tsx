"use client"

import { MessageCircle } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ConversationPreview } from "@/lib/types"

interface ChatListProps {
  conversations: ConversationPreview[]
  onSelectChat: (id: string) => void
}

export function ChatList({ conversations, onSelectChat }: ChatListProps) {
  const { t } = useTranslation()

  const items = conversations.map(c => ({
    id: c.match.id,
    name: c.partner.display_name || 'Student',
    initials: (c.partner.display_name || 'S').slice(0, 2).toUpperCase(),
    avatarColor: c.partner.avatar_color || 'bg-blue-500',
    unread: c.unreadCount,
    lastActive: new Date(c.match.matched_at).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' }),
    lastMessage: c.lastMessage?.text || '',
    isSystem: c.lastMessage?.is_system ?? false,
    subject: c.subject?.name || '',
    venue: c.venue?.name || '',
  }))

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <MessageCircle className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{t("chat.empty")}</h3>
        <p className="text-sm text-muted-foreground">{t("chat.empty.subtitle")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3">
        <h2 className="text-xl font-bold text-foreground">{t("chat.title")}</h2>
      </div>
      <div className="flex flex-col">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectChat(item.id)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 last:border-0"
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
                {item.lastMessage}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                {item.subject && <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">{item.subject}</Badge>}
                {item.venue && <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">{item.venue}</Badge>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
