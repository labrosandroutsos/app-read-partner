import { describe, expect, it } from "vitest"
import { calculateSuspensionEnd, canAssignStaffRole, canAssignVenueManager, canSuspendTarget } from "../lib/admin-permissions"
import type { AdminAccount } from "../lib/types"

const account = (overrides: Partial<AdminAccount> = {}): AdminAccount => ({
  profile: {
    id: "00000000-0000-4000-8000-000000000001",
    display_name: "Student",
    degree: null,
    semester: null,
    avatar_color: null,
    subjects: [],
    created_at: "2026-08-24T00:00:00.000Z",
  },
  role: null,
  managedVenueId: null,
  ...overrides,
})

describe("administration permissions", () => {
  it("prevents an admin from changing their own role", () => {
    const target = account()
    expect(canAssignStaffRole(target, target.profile.id)).toBe(false)
  })

  it("keeps venue managers separate from staff roles", () => {
    expect(canAssignStaffRole(account({ managedVenueId: "venue-1" }), "another-user")).toBe(false)
    expect(canAssignVenueManager(account({ role: "moderator" }))).toBe(false)
  })

  it("allows moderators to suspend students but not privileged accounts", () => {
    expect(canSuspendTarget("moderator", null, false, false)).toBe(true)
    expect(canSuspendTarget("moderator", "moderator", false, false)).toBe(false)
    expect(canSuspendTarget("moderator", null, true, false)).toBe(false)
    expect(canSuspendTarget("moderator", null, false, true)).toBe(false)
  })

  it("allows admins to suspend moderators and venue managers, but not admins", () => {
    expect(canSuspendTarget("admin", "moderator", false, false)).toBe(true)
    expect(canSuspendTarget("admin", null, true, false)).toBe(true)
    expect(canSuspendTarget("admin", "admin", false, false)).toBe(false)
  })

  it("calculates bounded temporary suspensions", () => {
    const now = new Date("2026-08-24T10:00:00.000Z")
    expect(calculateSuspensionEnd(7, now)).toBe("2026-08-31T10:00:00.000Z")
    expect(calculateSuspensionEnd(null, now)).toBeNull()
    expect(() => calculateSuspensionEnd(0, now)).toThrow("Invalid suspension duration")
  })
})
