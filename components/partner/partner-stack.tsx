"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Clock3, MessageCircle, RotateCcw, SearchX, Send, UserPlus, X } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { PartnerCard } from "./partner-card"
import { MatchAnimation } from "./match-animation"
import { Button } from "@/components/ui/button"
import { swipeOnCandidate } from "@/lib/actions"
import { haptic } from "@/lib/haptics"
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

const FALLBACK_WIDTH = 340

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
  const el = locale === "el"
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [matchedPartner, setMatchedPartner] = useState<PartnerCandidate | null>(null)
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 })
  const [isAnimating, setIsAnimating] = useState(false)
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null)
  const [sentInterestCount, setSentInterestCount] = useState(0)
  const [canRewind, setCanRewind] = useState(false)
  const [justRewound, setJustRewound] = useState(false)

  const cardAreaRef = useRef<HTMLDivElement>(null)
  const cardWidth = useRef(FALLBACK_WIDTH)
  const startX = useRef(0)
  const startY = useRef(0)
  const lastX = useRef(0)
  const lastTime = useRef(0)
  const velocity = useRef(0)
  const isDragging = useRef(false)
  const rewindIndex = useRef<number | null>(null)

  const measure = useCallback(() => {
    const width = cardAreaRef.current?.getBoundingClientRect().width
    if (width && width > 0) cardWidth.current = width
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isAnimating) return
    measure()
    isDragging.current = true
    startX.current = e.clientX
    startY.current = e.clientY
    lastX.current = e.clientX
    lastTime.current = performance.now()
    velocity.current = 0
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [isAnimating, measure])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    const now = performance.now()
    const dt = now - lastTime.current
    if (dt > 0) velocity.current = (e.clientX - lastX.current) / dt
    lastX.current = e.clientX
    lastTime.current = now
    // Horizontal intent dominates; dampen vertical drift so cards don't slide off.
    setSwipeOffset({ x: dx, y: dy * 0.35 })
  }, [])

  const triggerSwipe = useCallback((direction: "left" | "right", fromButton = false) => {
    if (isAnimating) return
    setIsAnimating(true)
    setExitDirection(direction)
    haptic(direction === "right" ? "commit" : "tap")
    if (fromButton) {
      // Buttons should fly the card off the same way a swipe does.
      setSwipeOffset({ x: direction === "right" ? 1 : -1, y: 0 })
    }

    window.setTimeout(async () => {
      if (direction === "right") {
        const candidate = candidates[currentIndex]
        if (!sessionId || !candidate?.sessionId) {
          toast.error(t("partner.swipe.error"))
          setSwipeOffset({ x: 0, y: 0 })
          setExitDirection(null)
          setIsAnimating(false)
          return
        }
        try {
          const result = await swipeOnCandidate(sessionId, candidate.sessionId)
          if (result.matched) {
            haptic("match")
            setMatchedPartner(candidate)
            router.refresh()
          } else {
            setSentInterestCount((count) => count + 1)
            toast.success(el
              ? "Το ενδιαφέρον στάλθηκε. Θα γίνει match όταν σε επιλέξει και ο άλλος φοιτητής."
              : "Interest sent. You'll match when the other student chooses you too.")
          }
        } catch {
          toast.error(t("partner.swipe.error"))
          setSwipeOffset({ x: 0, y: 0 })
          setExitDirection(null)
          setIsAnimating(false)
          return
        }
        // A sent like can't be un-sent, so rewind is only offered after a skip.
        rewindIndex.current = null
        setCanRewind(false)
      } else {
        rewindIndex.current = currentIndex
        setCanRewind(true)
      }
      setCurrentIndex((prev) => prev + 1)
      setSwipeOffset({ x: 0, y: 0 })
      setExitDirection(null)
      setIsAnimating(false)
    }, 300)
  }, [candidates, currentIndex, el, isAnimating, router, sessionId, t])

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    const { x } = swipeOffset
    const distanceThreshold = cardWidth.current * 0.34
    const flick = Math.abs(velocity.current) > 0.5
    if (x > distanceThreshold || (flick && velocity.current > 0.5 && x > 20)) {
      triggerSwipe("right")
    } else if (x < -distanceThreshold || (flick && velocity.current < -0.5 && x < -20)) {
      triggerSwipe("left")
    } else {
      setSwipeOffset({ x: 0, y: 0 })
    }
  }, [swipeOffset, triggerSwipe])

  const handleRewind = useCallback(() => {
    if (rewindIndex.current === null || isAnimating) return
    haptic("tap")
    const target = rewindIndex.current
    rewindIndex.current = null
    setCanRewind(false)
    setExitDirection(null)
    setSwipeOffset({ x: 0, y: 0 })
    setCurrentIndex(target)
    // Gentle re-entrance for the restored card.
    setJustRewound(true)
    window.setTimeout(() => setJustRewound(false), 360)
  }, [isAnimating])

  const handleDismatchContinue = () => setMatchedPartner(null)

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
    const state = getMatchingEmptyStateKind({
      initialCandidateCount: candidates.length,
      activeMatchCount: feedback.activeMatchCount,
      pendingInterestCount: feedback.pendingInterestCount,
      sentInterestCount,
    })
    const title = state === "waiting"
      ? (el ? "Το ενδιαφέρον σου στάλθηκε" : "Your interest is on its way")
      : state === "existing-match"
        ? (el ? "Δεν υπάρχουν νέοι partners" : "No new partners right now")
        : state === "reviewed-all"
          ? (el ? "Τους είδες όλους για τώρα" : "You've seen everyone for now")
          : (el ? "Δεν βρέθηκαν partners ακόμη" : "No partners found yet")
    const subtitle = state === "waiting"
      ? (el ? "Η αναζήτηση παραμένει ενεργή. Θα σε ειδοποιήσουμε μόλις υπάρξει αμοιβαίο ενδιαφέρον." : "Your search stays active — we'll ping you the moment the interest is mutual.")
      : state === "reviewed-all"
        ? (el ? "Περίμενε απάντηση ή δοκίμασε πιο ευέλικτα κριτήρια." : "Wait for a reply, or try a broader set of preferences.")
        : (el ? "Η αναζήτησή σου παραμένει ενεργή μέχρι τη λήξη της." : "Your search stays active until its scheduled end time.")
    const expiresAt = feedback.searchExpiresAt ? new Date(feedback.searchExpiresAt) : null
    const expiryLabel = expiresAt && Number.isFinite(expiresAt.getTime())
      ? expiresAt.toLocaleString(el ? "el-GR" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
      : null
    const pendingTotal = feedback.pendingInterestCount + sentInterestCount

    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-5 px-5 py-12 text-center duration-500 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-accent/25 to-primary/10">
          {state === "waiting"
            ? <Send className="h-9 w-9 text-primary" />
            : <SearchX className="h-9 w-9 text-primary" />}
        </div>
        <div className="space-y-1.5">
          <h3 className="study-title text-2xl text-foreground">{title}</h3>
          <p className="text-[15px] leading-6 text-muted-foreground">{subtitle}</p>
          {expiryLabel && <p className="text-xs font-semibold text-primary">{el ? `Ενεργή έως ${expiryLabel}` : `Active until ${expiryLabel}`}</p>}
        </div>

        <div className="w-full space-y-2.5 text-left">
          {pendingTotal > 0 && (
            <div className="flex gap-3 rounded-2xl border bg-card p-3.5 shadow-sm">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-accent-strong" />
              <div>
                <p className="text-sm font-semibold">{el ? "Αναμονή για αμοιβαίο ενδιαφέρον" : "Waiting for mutual interest"}</p>
                <p className="text-xs text-muted-foreground">{el ? `${pendingTotal} ενεργή ${pendingTotal === 1 ? "επιλογή" : "επιλογές"}.` : `${pendingTotal} pending ${pendingTotal === 1 ? "like" : "likes"}.`}</p>
              </div>
            </div>
          )}
          {feedback.activeMatchCount > 0 && (
            <div className="flex gap-3 rounded-2xl border bg-card p-3.5 shadow-sm">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">{el ? "Οι υπάρχοντες partners δεν εμφανίζονται ξανά" : "Existing partners aren't shown again"}</p>
                <p className="text-xs text-muted-foreground">{el ? "Άνοιξε το Chat για να συνεχίσεις." : "Open Chat to keep the conversation going."}</p>
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-dashed p-3.5 text-xs leading-5 text-muted-foreground">
            {el ? "Για περισσότερα αποτελέσματα, δοκίμασε μεγαλύτερο χρονικό διάστημα, «Αποφασίζουμε μαζί» ή πιο ευέλικτες προτιμήσεις." : "For more results, try a longer time window, “Decide together,” or more flexible study preferences."}
          </div>
        </div>

        <div className="flex w-full gap-2.5">
          {feedback.activeMatchCount > 0 && (
            <Button onClick={onGoToChat} className="flex-1"><MessageCircle className="h-4 w-4" />{el ? "Άνοιγμα Chat" : "Open Chat"}</Button>
          )}
          <Button onClick={onRestart} variant="outline" className="flex-1"><RotateCcw className="h-4 w-4" />{t("partner.restart")}</Button>
        </div>
      </div>
    )
  }

  const { x, y } = swipeOffset
  const rotation = Math.max(-14, Math.min(14, (x / cardWidth.current) * 12))
  const dragProgress = Math.min(Math.abs(x) / (cardWidth.current * 0.5), 1)
  const connectOpacity = Math.max(0, Math.min(x / (cardWidth.current * 0.4), 1))
  const skipOpacity = Math.max(0, Math.min(-x / (cardWidth.current * 0.4), 1))
  const settling = !isDragging.current

  const exitTransform = exitDirection
    ? `translate(${exitDirection === "right" ? cardWidth.current * 1.6 : -cardWidth.current * 1.6}px, ${y}px) rotate(${exitDirection === "right" ? 22 : -22}deg)`
    : undefined

  // The next card rises to meet the user as the front card is dragged away.
  const nextRise = dragProgress
  const nextCardStyle: React.CSSProperties = {
    transform: `scale(${0.94 + 0.06 * nextRise}) translateY(${14 * (1 - nextRise)}px)`,
    zIndex: 9,
    opacity: 1,
    transition: settling ? "transform 0.3s var(--ease-out-quint)" : "none",
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-3">
      <div ref={cardAreaRef} className="relative mx-auto w-full max-w-sm aspect-[3/4] max-h-[500px]">
        {candidates[currentIndex + 2] && (
          <PartnerCard
            key={candidates[currentIndex + 2].id}
            candidate={candidates[currentIndex + 2]}
            matchSubject={matchSubject}
            subjects={subjects}
            style={{ transform: "scale(0.88) translateY(28px)", zIndex: 8, opacity: 0.55 }}
          />
        )}
        {candidates[currentIndex + 1] && (
          <PartnerCard
            key={candidates[currentIndex + 1].id}
            candidate={candidates[currentIndex + 1]}
            matchSubject={matchSubject}
            subjects={subjects}
            style={nextCardStyle}
          />
        )}

        <div
          className={`absolute inset-0 touch-pan-y ${justRewound ? "animate-in fade-in duration-300" : ""}`}
          style={{
            zIndex: 20,
            transformOrigin: "50% 130%",
            transform: exitTransform || `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
            transition: exitTransform
              ? "transform 0.32s var(--ease-out-quint), opacity 0.32s ease-in"
              : settling ? "transform 0.34s var(--ease-out-back)" : "none",
            opacity: exitDirection ? 0 : 1,
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

          {/* Connect wash + chip — warm, kind, not a dating "LIKE" stamp. */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-l from-primary/30 via-primary/5 to-transparent"
            style={{ opacity: connectOpacity }}
          />
          <div
            className="pointer-events-none absolute left-5 top-5 flex items-center gap-1.5 rounded-full border border-primary/30 bg-card/85 px-3.5 py-1.5 text-sm font-bold text-primary shadow-sm backdrop-blur-md"
            style={{ opacity: connectOpacity, transform: `scale(${0.8 + 0.2 * connectOpacity})` }}
          >
            <UserPlus className="h-4 w-4" />{el ? "Ας τα πούμε" : "Connect"}
          </div>

          {/* Skip wash + chip — neutral, "not now," never hostile red. */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-r from-muted-foreground/25 via-muted-foreground/5 to-transparent"
            style={{ opacity: skipOpacity }}
          />
          <div
            className="pointer-events-none absolute right-5 top-5 flex items-center gap-1.5 rounded-full border border-border bg-card/85 px-3.5 py-1.5 text-sm font-bold text-muted-foreground shadow-sm backdrop-blur-md"
            style={{ opacity: skipOpacity, transform: `scale(${0.8 + 0.2 * skipOpacity})` }}
          >
            <X className="h-4 w-4" />{el ? "Άλλη φορά" : "Skip"}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-5">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full disabled:opacity-40"
          onClick={handleRewind}
          disabled={!canRewind || isAnimating}
          aria-label={el ? "Επαναφορά τελευταίας κάρτας" : "Rewind last card"}
        >
          <RotateCcw className="h-5 w-5 text-accent-strong" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-16 w-16 rounded-full border-2 shadow-sm hover:border-muted-foreground/40"
          onClick={() => triggerSwipe("left", true)}
          disabled={isAnimating}
          aria-label={el ? "Άλλη φορά" : "Skip"}
        >
          <X className="h-7 w-7 text-muted-foreground" />
        </Button>
        <Button
          size="icon"
          className="h-16 w-16 rounded-full"
          onClick={() => triggerSwipe("right", true)}
          disabled={isAnimating}
          aria-label={el ? "Ας τα πούμε" : "Connect"}
        >
          <UserPlus className="h-7 w-7" />
        </Button>
      </div>
    </div>
  )
}
