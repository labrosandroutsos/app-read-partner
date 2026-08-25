"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Check, Clock3, MessageCircle, RotateCcw, SearchX, Send, X } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { PartnerCard } from "./partner-card"
import { MatchAnimation } from "./match-animation"
import { Button } from "@/components/ui/button"
import { swipeOnCandidate } from "@/lib/actions"
import { toast } from "sonner"
import { getMatchingEmptyStateKind } from "@/lib/matching-feedback"
import type { MatchingSearchFeedback, PartnerCandidate, Subject } from "@/lib/types"

interface PartnerStackProps {
  candidates: PartnerCandidate[]
  feedback: MatchingSearchFeedback
  matchSubject: string
  onGoToChat: () => void
  onRestart: () => void
  sessionId?: string | null
  subjects?: Subject[]
  currentUserInitials: string
  currentUserColor: string
}

export function PartnerStack({
  candidates,
  feedback,
  matchSubject,
  onGoToChat,
  onRestart,
  sessionId,
  subjects,
  currentUserInitials,
  currentUserColor,
}: PartnerStackProps) {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [matchedPartner, setMatchedPartner] = useState<PartnerCandidate | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null)
  const [sentInterestCount, setSentInterestCount] = useState(0)
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
        const candidate = candidates[currentIndex]

        if (!sessionId || !candidate?.sessionId) {
          toast.error(t("partner.swipe.error"))
          setSwipeOffset(0)
          setExitDirection(null)
          setIsAnimating(false)
          return
        }

        try {
          const result = await swipeOnCandidate(sessionId, candidate.sessionId)
          if (result.matched) {
            setMatchedPartner(candidate)
            router.refresh()
          } else {
            setSentInterestCount((count) => count + 1)
            toast.success(locale === "el" ? "Το ενδιαφέρον στάλθηκε. Θα γίνει match όταν σε επιλέξει και ο άλλος φοιτητής." : "Interest sent. You'll match when the other student chooses you too.")
          }
        } catch {
          toast.error(t("partner.swipe.error"))
          setSwipeOffset(0)
          setExitDirection(null)
          setIsAnimating(false)
          return
        }
      }
      setCurrentIndex((prev) => prev + 1)
      setSwipeOffset(0)
      setExitDirection(null)
      setIsAnimating(false)
    }, 300)
  }, [candidates, currentIndex, locale, router, sessionId, t])

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
        currentUserInitials={currentUserInitials}
        currentUserColor={currentUserColor}
        onGoToChat={onGoToChat}
        onContinue={handleDismatchContinue}
      />
    )
  }

  if (currentIndex >= candidates.length) {
    const el = locale === "el"
    const state = getMatchingEmptyStateKind({
      initialCandidateCount: candidates.length,
      activeMatchCount: feedback.activeMatchCount,
      pendingInterestCount: feedback.pendingInterestCount,
      sentInterestCount,
    })
    const title = state === "waiting"
      ? (el ? "Το ενδιαφέρον σου στάλθηκε" : "Your interest was sent")
      : state === "existing-match"
        ? (el ? "Δεν υπάρχουν νέοι partners" : "No new partners right now")
        : state === "reviewed-all"
          ? (el ? "Είδες όλους τους διαθέσιμους partners" : "You've reviewed every available partner")
          : (el ? "Δεν βρέθηκαν partners ακόμη" : "No partners found yet")
    const subtitle = state === "waiting"
      ? (el ? "Η αναζήτηση παραμένει ενεργή. Θα γίνει match μόλις υπάρξει αμοιβαίο ενδιαφέρον." : "Your search remains active. A match will be created as soon as the interest is mutual.")
      : state === "reviewed-all"
        ? (el ? "Μπορείς να περιμένεις απάντηση ή να δοκιμάσεις νέα κριτήρια." : "You can wait for a response or try a new set of preferences.")
        : (el ? "Η αναζήτησή σου παραμένει ενεργή μέχρι τη λήξη της." : "Your search stays active until its scheduled end time.")
    const expiresAt = feedback.searchExpiresAt ? new Date(feedback.searchExpiresAt) : null
    const expiryLabel = expiresAt && Number.isFinite(expiresAt.getTime())
      ? expiresAt.toLocaleString(el ? "el-GR" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
      : null

    return (
      <div className="flex flex-col items-center justify-center gap-4 px-5 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {state === "waiting" ? <Send className="h-7 w-7 text-primary" /> : <SearchX className="h-7 w-7 text-primary" />}
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="max-w-sm text-sm text-muted-foreground">{subtitle}</p>
          {expiryLabel && <p className="text-xs font-medium text-primary">{el ? `Ενεργή έως ${expiryLabel}` : `Active until ${expiryLabel}`}</p>}
        </div>

        <div className="w-full max-w-sm space-y-2 text-left">
          {feedback.pendingInterestCount + sentInterestCount > 0 && (
            <div className="flex gap-3 rounded-xl border bg-card p-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div><p className="text-sm font-medium">{el ? "Αναμονή για αμοιβαίο ενδιαφέρον" : "Waiting for mutual interest"}</p><p className="text-xs text-muted-foreground">{el ? `${feedback.pendingInterestCount + sentInterestCount} ενεργή ${feedback.pendingInterestCount + sentInterestCount === 1 ? "επιλογή" : "επιλογές"}.` : `${feedback.pendingInterestCount + sentInterestCount} pending ${feedback.pendingInterestCount + sentInterestCount === 1 ? "like" : "likes"}.`}</p></div>
            </div>
          )}
          {feedback.activeMatchCount > 0 && (
            <div className="flex gap-3 rounded-xl border bg-card p-3">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div><p className="text-sm font-medium">{el ? "Οι υπάρχοντες partners δεν εμφανίζονται ξανά" : "Existing partners aren't shown again"}</p><p className="text-xs text-muted-foreground">{el ? "Άνοιξε το Chat για να συνεχίσεις ή τερμάτισε το ενεργό match αν θέλεις να κάνετε νέο match." : "Open Chat to continue, or end the active match if you want to match with that student again."}</p></div>
            </div>
          )}
          <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
            {el ? "Για περισσότερα αποτελέσματα, δοκίμασε μεγαλύτερο χρονικό διάστημα, «Οπουδήποτε κοντά» ή πιο ευέλικτες προτιμήσεις." : "For more results, try a longer time window, Anywhere nearby, or more flexible study preferences."}
          </div>
        </div>

        <div className="flex w-full max-w-sm gap-2">
          {feedback.activeMatchCount > 0 && <Button onClick={onGoToChat} className="flex-1"><MessageCircle className="h-4 w-4" />{el ? "Άνοιγμα Chat" : "Open Chat"}</Button>}
          <Button onClick={onRestart} variant="outline" className="flex-1"><RotateCcw className="h-4 w-4" />{t("partner.restart")}</Button>
        </div>
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
        {candidates.slice(currentIndex + 1, currentIndex + 3).map((candidate, i) => (
          <PartnerCard
            key={candidate.id}
            candidate={candidate}
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
            candidate={candidates[currentIndex]}
            matchSubject={matchSubject}
            subjects={subjects}
            onBlocked={() => setCurrentIndex((prev) => prev + 1)}
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
