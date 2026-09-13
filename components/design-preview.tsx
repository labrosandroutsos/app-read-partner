"use client"

import { useState } from "react"
import { DailyWizard } from "@/components/partner/daily-wizard"
import { BottomTabBar, type TabId } from "@/components/bottom-tab-bar"
import { StudyHeader } from "@/components/study-header"
import { Button } from "@/components/ui/button"

// Local-only visual review: no accounts, network mutations, or real student data.
export function DesignPreview() {
  const [tab, setTab] = useState<TabId>("partner")
  const [complete, setComplete] = useState(false)
  return <div className="relative mx-auto flex h-dvh max-w-[760px] flex-col overflow-hidden border-x bg-background">
    <StudyHeader />
    <main className="min-h-0 flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <p className="px-5 pt-2 text-[11px] text-muted-foreground">Preview · sample subjects · nothing saved</p>
      <div hidden={tab !== "partner"}>
        {complete ? <div className="space-y-4 p-6"><h1 className="text-2xl font-semibold">You’re ready to find a partner.</h1><p>This preview stops before matchmaking. No search was created.</p><Button onClick={() => setComplete(false)}>Try again</Button></div> : <DailyWizard subjects={[{id:1,faculty:"Demo",name:"Μαθηματικά",name_en:"Mathematics"},{id:2,faculty:"Demo",name:"Πληροφορική",name_en:"Computer Science"},{id:3,faculty:"Demo",name:"Βιολογία",name_en:"Biology"},{id:4,faculty:"Demo",name:"Οικονομικά",name_en:"Economics"},{id:5,faculty:"Demo",name:"Φυσική",name_en:"Physics"},{id:6,faculty:"Demo",name:"Ψυχολογία",name_en:"Psychology"}]} onComplete={() => setComplete(true)} />}
      </div>
      {tab !== "partner" && <div className="p-6 text-sm text-muted-foreground">This local preview focuses on finding a partner. Sign in to use the other features.</div>}
    </main>
    <BottomTabBar activeTab={tab} onTabChange={setTab} unreadChats={0} unreadInterests={0} />
  </div>
}
