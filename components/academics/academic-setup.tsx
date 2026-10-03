'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import {
  CIVIL_DEPARTMENT,
  validateAcademicSelection,
} from '@/lib/academic-catalogue'
import { saveAcademicProfile } from '@/lib/academic-actions'
import type { Profile } from '@/lib/types'

export function AcademicSetup({
  profile,
  onPreviewComplete,
}: {
  profile?: Profile | null
  onPreviewComplete?: (semester: number) => void
}) {
  const { locale } = useTranslation()
  const el = locale === 'el'
  const router = useRouter()
  const [department, setDepartment] = useState(profile?.department_id ?? '')
  const [entryYear, setEntryYear] = useState(String(profile?.entry_year ?? ''))
  const [semester, setSemester] = useState(
    String(Math.min(profile?.semester ?? 1, 11)),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const input = {
        departmentId: department,
        entryYear: Number(entryYear),
        semester: Number(semester),
      }
      validateAcademicSelection(input)
      if (onPreviewComplete) onPreviewComplete(input.semester)
      else {
        await saveAcademicProfile(input)
        router.push('/app')
        router.refresh()
      }
    } catch {
      setError(
        el
          ? 'Δεν αποθηκεύτηκαν οι σπουδές σου. Έλεγξε τα πεδία και δοκίμασε ξανά.'
          : 'Could not save your studies. Check the fields and try again.',
      )
    } finally {
      setBusy(false)
    }
  }
  const selectStyle =
    'h-12 w-full rounded-xl border border-input bg-card px-3 text-base'
  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <BookOpen className="mb-6 h-7 w-7 text-primary" aria-hidden="true" />
      <h1 className="study-title text-3xl">
        {el ? 'Πού σπουδάζεις;' : 'Where do you study?'}
      </h1>
      <p className="mt-3 mb-7 text-muted-foreground">
        {el
          ? 'Βρες σημειώσεις και παρέα για τα μαθήματα του τμήματός σου.'
          : 'Find notes and study partners for your department’s courses.'}
      </p>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label
            htmlFor="university"
            className="mb-2 block text-sm font-medium"
          >
            {el ? 'Πανεπιστήμιο' : 'University'}
          </label>
          <select
            id="university"
            className={selectStyle}
            value="upatras"
            disabled
          >
            <option value="upatras">
              {el ? 'Πανεπιστήμιο Πατρών' : 'University of Patras'}
            </option>
          </select>
        </div>
        <div>
          <label
            htmlFor="department"
            className="mb-2 block text-sm font-medium"
          >
            {el ? 'Τμήμα' : 'Department'}
          </label>
          <select
            required
            id="department"
            className={selectStyle}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">
              {el ? 'Επίλεξε τμήμα' : 'Choose department'}
            </option>
            <option value={CIVIL_DEPARTMENT}>
              {el ? 'Πολιτικών Μηχανικών' : 'Civil Engineering'}
            </option>
          </select>
          <p className="mt-2 text-xs text-muted-foreground">
            {el
              ? 'Ξεκινάμε με τους Πολιτικούς Μηχανικούς. Θα προστεθούν και άλλα τμήματα.'
              : 'Civil Engineering is our first department. More departments will follow.'}
          </p>
        </div>
        <div>
          <label
            htmlFor="entry-year"
            className="mb-2 block text-sm font-medium"
          >
            {el ? 'Έτος εισαγωγής' : 'Entry year'}
          </label>
          <select
            required
            id="entry-year"
            className={selectStyle}
            value={entryYear}
            onChange={(e) => setEntryYear(e.target.value)}
          >
            <option value="">{el ? 'Επίλεξε έτος' : 'Choose year'}</option>
            {Array.from({ length: 13 }, (_, i) => 2026 - i).map((y) => (
              <option key={y} value={y}>
                {y}–{y + 1}
              </option>
            ))}
            <option value="older">{el ? 'Πριν το 2014' : 'Before 2014'}</option>
          </select>
        </div>
        {entryYear === 'older' && (
          <p role="status" className="text-sm text-muted-foreground">
            {el
              ? 'Το παλαιότερο πρόγραμμα σπουδών δεν έχει προστεθεί ακόμη. Μπορείς να δεις τον επίσημο οδηγό παρακάτω.'
              : 'The older curriculum is not available yet. You can view the official guide below.'}
          </p>
        )}
        <div>
          <label
            htmlFor="current-semester"
            className="mb-2 block text-sm font-medium"
          >
            {el ? 'Τρέχον εξάμηνο' : 'Current semester'}
          </label>
          <select
            id="current-semester"
            className={selectStyle}
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
            <option value="11">{el ? '11ο και άνω' : '11 or above'}</option>
          </select>
          <p className="mt-2 text-xs text-muted-foreground">
            {el
              ? 'Θα μπορείς πάντα να επιλέγεις μαθήματα από όλα τα εξάμηνα.'
              : 'You can always choose courses from any semester.'}
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          className="h-12 w-full"
          disabled={busy || !department || !entryYear || entryYear === 'older'}
        >
          {busy
            ? el
              ? 'Αποθήκευση…'
              : 'Saving…'
            : el
              ? 'Βρες τα μαθήματά σου'
              : 'Find your courses'}
        </Button>
        <a
          className="block text-sm text-primary underline underline-offset-4"
          href="https://www.civil.upatras.gr/index.php/odhgos/"
          target="_blank"
          rel="noreferrer"
        >
          {el
            ? 'Επίσημος οδηγός σπουδών · 2026–27'
            : 'Official study guide · 2026–27'}
        </a>
        {!onPreviewComplete && (
          <Link
            href="/app?catalogue=later"
            className="flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4"
          >
            {el
              ? 'Δεν καλύπτεται το πρόγραμμά μου — συνέχεια με γενικά μαθήματα'
              : 'My programme is not listed — continue with general subjects'}
          </Link>
        )}
      </form>
    </main>
  )
}
