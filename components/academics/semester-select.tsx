'use client'
import { useId } from 'react'
import { useTranslation } from '@/lib/i18n'
export function SemesterSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const id = useId()
  const { locale } = useTranslation()
  return (
    <div className="mb-4 space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {locale === 'el' ? 'Εξάμηνο μαθημάτων' : 'Course semester'}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-input bg-card px-3 text-base focus-visible:outline-ring"
      >
        <option value="all">
          {locale === 'el' ? 'Όλα τα εξάμηνα' : 'All semesters'}
        </option>
        {Array.from({ length: 10 }, (_, i) => (
          <option key={i + 1} value={String(i + 1)}>
            {locale === 'el' ? `${i + 1}ο εξάμηνο` : `Semester ${i + 1}`}
          </option>
        ))}
      </select>
    </div>
  )
}
