"use client"

import { useState, useRef, useCallback } from "react"
import { Check, X, RotateCcw } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { PartnerCard } from "./partner-card"
import { MatchAnimation } from "./match-animation"
import { Button } from "@/components/ui/button"
import { createMatch } from "@/lib/actions"
import type { Profile, Subject, PartnerCardData } from "@/lib/types"

interface PartnerStackProps {
  students: PartnerCardData[]
  matchSubject: string
  onGoToChat: () => void
  onRestart: () => void
  userId?: string
  profile?: Profile | null
  sessionId?: string | null
  subjects?: Subject[]
}

export function PartnerStack({ students, matchSubject, onGoToChat, onRestart, userId, profile, sessionId, subjects }: PartnerStackProps) {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [matchedPartner, setMatchedPartner] = useState<PartnerCardData | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null)
  const startX = useRef(0)
  const isDragging = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isAnimating) return
    isDragging.current = true
    startX.current = e.clientX
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [isAnimating])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    const diff = e.clientX - startX.current
    setSwipeOffset(diff)
  }, [])

  const triggerSwipe = useCallback(async (direction: "left" | "right") => {
    setIsAnimating(true)
    setExitDirection(direction)

    setTimeout(async () => {
      if (direction === "right") {
        const student = students[currentIndex]

        if (userId && sessionId && student.id) {
          try {
            const subjectId = parseInt(matchSubject) || 1
            const result = await createMatch(sessionId, student.id, subjectId, null)
            if (result.matched) {
              setMatchedPartner(student)
              setSwipeOffset(0)
              setExitDirection(null)
              setIsAnimating(false)
              setCurrentIndex((prev) => prev + 1)
              return
            }
          } catch {
            // Match request failed — continue swiping
          }
        }
      }
      setCurrentIndex((prev) => prev + 1)
      setSwipeOffset(0)
      setExitDirection(null)
      setIsAnimating(false)
    }, 300)
  }, [currentIndex, students, userId, sessionId, matchSubject])

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false

    const threshold = 80
    if (swipeOffset > threshold) {
      triggerSwipe("right")
    } else if (swipeOffset < -threshold) {
      triggerSwipe("left")
    } else {
      setSwipeOffset(0)
    }
  }, [swipeOffset, triggerSwipe])

  const handleDismatchContinue = () => {
    setMatchedPartner(null)
  }

  if (matchedPartner) {
    return (
      <MatchAnimation
        partner={matchedPartner}
        profile={profile}
        onGoToChat={onGoToChat}
        onContinue={handleDismatchContinue}
      />
    )
  }

  if (currentIndex >= students.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <RotateCcw className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{t("partner.nomore")}</h3>
        <p className="text-sm text-muted-foreground">{t("partner.nomore.subtitle")}</p>
        <Button onClick={onRestart} variant="outline">
          {t("partner.restart")}
        </Button>
      </div>
    )
  }

  const rotation = swipeOffset * 0.08
  const likeOpacity = Math.min(Math.max(swipeOffset / 120, 0), 1)
  const nopeOpacity = Math.min(Math.max(-swipeOffset / 120, 0), 1)

  const exitTransform = exitDirection === "right"
    ? "translateX(120%) rotate(20deg)"
    : exitDirection === "left"
    ? "translateX(-120%) rotate(-20deg)"
    : undefined

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="relative w-full aspect-[3/4] max-h-[480px]">
        {students.slice(currentIndex + 1, currentIndex + 3).map((student, i) => (
          <PartnerCard
            key={student.id}
            student={student}
            matchSubject={matchSubject}
            subjects={subjects}
            style={{
              transform: `scale(${1 - (i + 1) * 0.04}) translateY(${(i + 1) * 8}px)`,
              zIndex: 10 - i - 1,
              opacity: 1 - (i + 1) * 0.15,
            }}
          />
        ))}

        <div
          className="absolute inset-0"
          style={{
            zIndex: 20,
            transform: exitTransform || `translateX(${swipeOffset}px) rotate(${rotation}deg)`,
            transition: exitTransform || !isDragging.current ? "transform 0.3s ease-out" : "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <PartnerCard
            student={students[currentIndex]}
            matchSubject={matchSubject}
            subjects={subjects}
          />

          <div
            className="absolute inset-0 rounded-2xl border-4 border-emerald-500 bg-emerald-500/10 flex items-center justify-center pointer-events-none"
            style={{ opacity: likeOpacity }}
          >
            <span className="text-5xl font-black text-emerald-500 rotate-[-20deg] border-4 border-emerald-500 rounded-lg px-4 py-1">
              LIKE
            </span>
          </div>

          <div
            className="absolute inset-0 rounded-2xl border-4 border-red-500 bg-red-500/10 flex items-center justify-center pointer-events-none"
            style={{ opacity: nopeOpacity }}
          >
            <span className="text-5xl font-black text-red-500 rotate-[20deg] border-4 border-red-500 rounded-lg px-4 py-1">
              NOPE
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-2 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          onClick={() => triggerSwipe("left")}
          disabled={isAnimating}
          aria-label="Skip"
        >
          <X className="h-6 w-6 text-red-500" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-2 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950"
          onClick={() => triggerSwipe("right")}
          disabled={isAnimating}
          aria-label="Like"
        >
          <Check className="h-6 w-6 text-emerald-500" />
        </Button>
      </div>
    </div>
  )
}
