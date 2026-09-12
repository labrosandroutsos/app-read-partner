"use client"

import { Search, MessageCircle, FileText, Building2, User } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
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
      className="absolute bottom-0 left-0 z-50 w-full border-t border-border bg-card"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg transition-colors relative min-w-[56px]",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                {((tab.id === "chat" && unreadChats > 0) || (tab.id === "partner" && unreadInterests > 0)) && (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center px-1">
                    {tab.id === "chat" ? unreadChats : unreadInterests}
                  </span>
                )}
              </div>
              <span className={cn("text-xs leading-tight", isActive ? "font-semibold" : "font-medium")}>
                {t(tab.labelKey as Parameters<typeof t>[0])}
              </span>
              {isActive && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
