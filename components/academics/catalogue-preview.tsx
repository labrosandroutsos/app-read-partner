'use client'
import { useState } from 'react'
import { AcademicSetup } from './academic-setup'
import { SemesterSelect } from './semester-select'
import {
  civilCatalogue,
  civilPreviewSubjects,
  filterCourses,
  academicTracks,
} from '@/lib/academic-catalogue'
import { DailyWizard } from '@/components/partner/daily-wizard'
import { NotesScreen } from '@/components/notes/notes-screen'
import { StudyHeader } from '@/components/study-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/i18n'
export function CataloguePreview() {
  const { locale } = useTranslation()
  const el = locale === 'el'
  const [currentSemester, setCurrentSemester] = useState<number | null>(null)
  const [semester, setSemester] = useState('all')
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('courses')
  const [complete, setComplete] = useState(false)
  if (currentSemester === null)
    return (
      <>
        <p className="px-5 pt-3 text-sm text-muted-foreground">
          {el
            ? 'Προεπισκόπηση · δεν αποθηκεύεται προφίλ'
            : 'Preview · profile is not saved'}
        </p>
        <AcademicSetup
          onPreviewComplete={(n) => {
            setCurrentSemester(n)
            setSemester(n <= 10 ? String(n) : 'all')
          }}
        />
      </>
    )
  const courses = filterCourses(civilPreviewSubjects, semester, query)
  return (
    <div className="mx-auto min-h-dvh max-w-[760px] bg-background">
      <StudyHeader />
      <div className="px-5 pt-5">
        <h1 className="study-title text-3xl">
          {el ? 'Πολιτικών Μηχανικών' : 'Civil Engineering'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {el
            ? 'Πανεπιστήμιο Πατρών · Π3 · Οδηγός 2026–27'
            : 'University of Patras · P3 · Guide 2026–27'}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {el
            ? 'Προεπισκόπηση · οι σημειώσεις είναι δείγμα, τα μαθήματα προέρχονται από τον επίσημο οδηγό.'
            : 'Preview · notes are samples; courses come from the official guide.'}
        </p>
        <Button
          variant="link"
          className="h-11 px-0"
          onClick={() => setCurrentSemester(null)}
        >
          {el ? 'Αλλαγή σπουδών' : 'Change studies'}
        </Button>
      </div>
      <nav
        aria-label={el ? 'Δοκιμή καταλόγου' : 'Catalogue preview'}
        className="flex gap-2 border-b px-5 pb-3"
      >
        {[
          ['courses', el ? 'Μαθήματα' : 'Courses'],
          ['notes', el ? 'Σημειώσεις' : 'Notes'],
          ['study', el ? 'Μελέτη' : 'Study'],
        ].map(([id, label]) => (
          <Button
            key={id}
            variant={tab === id ? 'default' : 'outline'}
            aria-pressed={tab === id}
            className="h-11 flex-1"
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </nav>
      {tab === 'courses' && (
        <main className="p-5">
          <SemesterSelect value={semester} onChange={setSemester} />
          <Input
            className="mb-5 h-12"
            aria-label={el ? 'Αναζήτηση μαθήματος' : 'Search courses'}
            placeholder={
              el ? 'Όνομα ή κωδικός μαθήματος' : 'Course name or code'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <p role="status" className="mb-3 text-sm text-muted-foreground">
            {courses.length}{' '}
            {el
              ? courses.length === 1
                ? 'μάθημα'
                : 'μαθήματα'
              : courses.length === 1
                ? 'course'
                : 'courses'}
          </p>
          <ul className="divide-y">
            {courses.map((c) => (
              <li className="py-4" key={c.course_code}>
                <h2 className="font-semibold">{c.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {c.course_code}
                </p>
                {c.offerings
                  ?.filter(
                    (o) =>
                      semester === 'all' || o.semester === Number(semester),
                  )
                  .map((o) => (
                    <p
                      key={`${o.semester}-${o.track}`}
                      className="mt-1 text-xs text-muted-foreground"
                    >
                      {o.semester}
                      {el ? 'ο εξάμηνο' : ' semester'} · {o.ects} ECTS ·{' '}
                      {academicTracks[o.track]}
                      {o.other_tracks_only
                        ? el
                          ? ' · μόνο για άλλες κατευθύνσεις'
                          : ' · other tracks only'
                        : ''}
                    </p>
                  ))}
              </li>
            ))}
          </ul>
          <a
            className="mt-5 inline-block text-sm text-primary underline"
            href={civilCatalogue.source.url}
            target="_blank"
            rel="noreferrer"
          >
            {el
              ? 'Πηγή: επίσημος οδηγός, σελ. 13–28'
              : 'Source: official guide, pp. 13–28'}
          </a>
        </main>
      )}
      {tab === 'notes' && (
        <NotesScreen
          preview
          subjects={civilPreviewSubjects}
          notes={[
            {
              id: 'catalogue-sample',
              title: el
                ? 'Δείγμα σημειώσεων — Εφαρμοσμένα Μαθηματικά I'
                : 'Sample notes — Applied Mathematics I',
              subject_id: civilPreviewSubjects[0].id,
              subject: civilPreviewSubjects[0],
              author_id: 'preview',
              file_url: null,
              likes_count: 0,
              downloads_count: 0,
              created_at: '2026-10-03',
            },
          ]}
        />
      )}
      {tab === 'study' &&
        (complete ? (
          <div className="p-5">
            <p role="status">
              {el
                ? 'Η επιλογή ολοκληρώθηκε. Δεν δημιουργήθηκε αναζήτηση σε αυτή την προεπισκόπηση.'
                : 'Selection complete. This preview did not create a live search.'}
            </p>
            <Button className="mt-4" onClick={() => setComplete(false)}>
              {el ? 'Ξανά' : 'Try again'}
            </Button>
          </div>
        ) : (
          <DailyWizard
            subjects={civilPreviewSubjects}
            initialSemester={currentSemester}
            onComplete={() => setComplete(true)}
          />
        ))}
    </div>
  )
}
