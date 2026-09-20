"use client"

import { Search, MessageCircle, FileText, Building2, User } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { haptic } from "@/lib/haptics"
import { cn } from "@/lib/utils"

export type TabId = "partner" | "chat" | "notes" | "venues" | "profile"

interface BottomTabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  unreadChats: number
  unreadInterests: number
}

const tabs: { id: TabId; icon: typeof Search; labelKey: string }[] = [
  { id: "partner", icon: Search, labelKey: "tab.partner" },
  { id: "chat", icon: MessageCircle, labelKey: "tab.chat" },
  { id: "notes", icon: FileText, labelKey: "tab.notes" },
  { id: "venues", icon: Building2, labelKey: "tab.venues" },
  { id: "profile", icon: User, labelKey: "tab.profile" },
]

export function BottomTabBar({ activeTab, onTabChange, unreadChats, unreadInterests }: BottomTabBarProps) {
  const { t } = useTranslation()

  return (
    <nav
      className="glass-surface relative z-50 w-full shrink-0 border-t border-border/70"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          const showBadge = (tab.id === "chat" && unreadChats > 0) || (tab.id === "partner" && unreadInterests > 0)
          return (
            <button
              key={tab.id}
              aria-current={isActive ? "page" : undefined}
              onClick={() => { haptic("select"); onTabChange(tab.id) }}
              className={cn(
                "group relative flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-2 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "relative flex h-9 w-14 items-center justify-center rounded-full transition-all duration-200 ease-[var(--ease-out-back)]",
                  isActive ? "bg-primary/12" : "bg-transparent"
                )}
              >
                <Icon
                  className={cn("h-[22px] w-[22px] transition-transform duration-200 ease-[var(--ease-out-back)]", isActive && "scale-110")}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                {showBadge && (
                  <span className="absolute right-2 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground shadow-sm">
                    {tab.id === "chat" ? unreadChats : unreadInterests}
                  </span>
                )}
              </span>
              <span className={cn("text-[11px] leading-tight", isActive ? "font-semibold" : "font-medium")}>
                {t(tab.labelKey as Parameters<typeof t>[0])}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
