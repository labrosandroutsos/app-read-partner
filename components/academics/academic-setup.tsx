'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import {
  departments,
  catalogueFor,
  validateAcademicSelection,
} from '@/lib/academic-catalogue'
import { saveAcademicProfile } from '@/lib/academic-actions'
import type { Profile } from '@/lib/types'

export function AcademicSetup({
  profile,
  onPreviewComplete,
}: {
  profile?: Profile | null
  onPreviewComplete?: (
    semester: number,
    department: string,
    entryYear: number,
  ) => void
}) {
  const { locale } = useTranslation()
  const el = locale === 'el'
  const router = useRouter()
  const [department, setDepartment] = useState(profile?.department_id ?? '')
  const [entryYear, setEntryYear] = useState(String(profile?.entry_year ?? ''))
  const [semester, setSemester] = useState(
    String(Math.min(profile?.semester ?? 1, 13)),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const selected = departments.find((d) => d.id === department)
  const catalogue = catalogueFor(department, Number(entryYear))
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
      if (onPreviewComplete)
        onPreviewComplete(input.semester, department, input.entryYear)
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
    'h-12 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-base'
  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <BookOpen className="mb-6 h-7 w-7 text-primary" aria-hidden="true" />
      <h1 className="study-title text-3xl">
        {el ? 'Πού σπουδάζεις;' : 'Where do you study?'}
      </h1>
      <p className="mb-7 mt-3 text-muted-foreground">
        {el
          ? 'Βρες παρέα για διάβασμα στο πανεπιστήμιό σου και σημειώσεις για τα μαθήματά σου.'
          : 'Find study company at your university and notes for your courses.'}
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
            id="department"
            className={selectStyle}
            required
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">
              {el ? 'Επίλεξε τμήμα' : 'Choose department'}
            </option>
            {[...departments]
              .sort((a, b) => a.name.localeCompare(b.name, 'el'))
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>
          {selected && (
            <p className="mt-2 text-xs text-muted-foreground">
              {el ? 'Έδρα τμήματος' : 'Department location'}: {selected.campus}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="entry-year"
            className="mb-2 block text-sm font-medium"
          >
            {el ? 'Έτος εισαγωγής' : 'Entry year'}
          </label>
          <select
            id="entry-year"
            className={selectStyle}
            required
            value={entryYear}
            onChange={(e) => setEntryYear(e.target.value)}
          >
            <option value="">{el ? 'Επίλεξε έτος' : 'Choose year'}</option>
            {Array.from({ length: 77 }, (_, i) => 2026 - i).map((y) => (
              <option key={y} value={y}>
                {y}–{y + 1}
              </option>
            ))}
          </select>
        </div>
        {department && entryYear && (
          <p role="status" className="text-sm text-muted-foreground">
            {catalogue
              ? el
                ? `Διαθέσιμα μαθήματα: ${catalogue.curriculum.label}.`
                : `Courses available: ${catalogue.curriculum.label}.`
              : el
                ? 'Ο κατάλογος για το πρόγραμμά σου δεν είναι ακόμη διαθέσιμος. Μπορείς ήδη να βρεις παρέα για γενικό διάβασμα.'
                : 'Your programme’s course catalogue is not available yet. You can still find company for general studying.'}
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
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
            <option value="13">{el ? '13ο και άνω' : '13 or above'}</option>
          </select>
          <p className="mt-2 text-xs text-muted-foreground">
            {el
              ? 'Τα μαθήματα προηγούμενων εξαμήνων παραμένουν διαθέσιμα.'
              : 'Courses from earlier semesters remain available.'}
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          className="h-12 w-full"
          disabled={busy || !department || !entryYear}
        >
          {busy
            ? el
              ? 'Αποθήκευση…'
              : 'Saving…'
            : el
              ? 'Συνέχεια'
              : 'Continue'}
        </Button>
        {selected && (
          <a
            className="flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
            href={catalogue?.source.url ?? selected.url}
            target="_blank"
            rel="noreferrer"
          >
            {catalogue
              ? el
                ? 'Επίσημος οδηγός σπουδών'
                : 'Official study guide'
              : el
                ? 'Πληροφορίες τμήματος'
                : 'Department information'}
          </a>
        )}
        {!onPreviewComplete && (
          <Link
            href="/app?catalogue=later"
            className="flex min-h-11 items-center text-sm text-muted-foreground underline underline-offset-4"
          >
            {el ? 'Θα το συμπληρώσω αργότερα' : 'I’ll complete this later'}
          </Link>
        )}
      </form>
    </main>
  )
}
