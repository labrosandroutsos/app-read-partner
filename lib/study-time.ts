/** Round up to a half-hour slot, leaving at least 30 minutes to prepare. */
export function nextStudyStart(now: Date): Date {
  const slot = 30 * 60_000
  return new Date(Math.ceil((now.getTime() + slot) / slot) * slot)
}

export function isFutureStudyTime(date: string, time: string, latestDate: string, now = Date.now()): boolean {
  const timestamp = new Date(`${date}T${time}:00`).getTime()
  return Boolean(date && time && date <= latestDate && Number.isFinite(timestamp) && timestamp > now)
}
