import type { ReactNode } from "react"

export function ScreenHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="px-5 pb-6 pt-6">
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em]">{title}</h1>
      {action}
    </div>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
  </div>
}
