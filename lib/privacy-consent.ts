export const PRIVACY_CONSENT_KEY = "read-partner-privacy-v1"
export const PRIVACY_CONSENT_VERSION = 1

export interface PrivacyConsent {
  version: number
  analytics: boolean
  decidedAt: string
}

export function createPrivacyConsent(analytics: boolean, decidedAt = new Date()): PrivacyConsent {
  return {
    version: PRIVACY_CONSENT_VERSION,
    analytics,
    decidedAt: decidedAt.toISOString(),
  }
}

export function parsePrivacyConsent(value: string | null): PrivacyConsent | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as Partial<PrivacyConsent>
    if (parsed.version !== PRIVACY_CONSENT_VERSION || typeof parsed.analytics !== "boolean" || typeof parsed.decidedAt !== "string") {
      return null
    }
    if (!Number.isFinite(Date.parse(parsed.decidedAt))) return null
    return parsed as PrivacyConsent
  } catch {
    return null
  }
}
