import type { AdminAccount, AppRole } from "./types"

export function canAssignStaffRole(account: AdminAccount, currentUserId: string): boolean {
  return account.profile.id !== currentUserId && !account.managedVenueId
}

export function canAssignVenueManager(account: AdminAccount): boolean {
  return account.role === null
}

export function canSuspendTarget(actorRole: AppRole, targetRole: AppRole | null, targetIsVenueManager: boolean, isSelf: boolean): boolean {
  if (isSelf || targetRole === "admin") return false
  if (actorRole === "moderator" && (targetRole !== null || targetIsVenueManager)) return false
  return true
}

export function calculateSuspensionEnd(days: number | null, now = new Date()): string | null {
  if (days === null) return null
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error("Invalid suspension duration")
  return new Date(now.getTime() + days * 86_400_000).toISOString()
}
