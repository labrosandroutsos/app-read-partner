// Lightweight feedback helper.
//
// iOS Safari does NOT support navigator.vibrate (and likely never will), so haptics
// are treated as a progressive enhancement for Android. The visual "punch" that
// callers pair with these calls is what makes taps feel responsive on every device.
// All calls are no-ops under prefers-reduced-motion.

type FeedbackKind = "tap" | "select" | "commit" | "match" | "error"

const PATTERNS: Record<FeedbackKind, number | number[]> = {
  tap: 8,
  select: 12,
  commit: 16,
  match: [0, 26, 40, 26],
  error: [0, 20, 50, 20],
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Fire a short haptic where the platform supports it. Safe to call anywhere,
 * on any device — it silently does nothing when unsupported or when the user
 * prefers reduced motion.
 */
export function haptic(kind: FeedbackKind = "tap"): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return
  if (prefersReducedMotion()) return
  try {
    navigator.vibrate(PATTERNS[kind])
  } catch {
    // Some browsers throw if called without a user gesture; ignore.
  }
}
