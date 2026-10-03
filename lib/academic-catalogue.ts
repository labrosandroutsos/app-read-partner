import catalogue from '@/data/catalogues/upatras-civil-2026.json'
import type { Subject } from '@/lib/types'

export const civilCatalogue = catalogue
export const CIVIL_DEPARTMENT = catalogue.department.id
export const CIVIL_CURRICULUM = catalogue.curriculum.id
export const academicTracks = [
  'Κοινός κορμός',
  'Κατασκευές',
  'Γεωτεχνική Μηχανική – Έργα Υποδομής',
  'Υδραυλική Μηχανική – Τεχνολογία Περιβάλλοντος',
  'Συστήματα Βιώσιμων Μεταφορών και Διαχείρισης Έργων',
]
export function normalizeCourseSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('el')
    .replace(/ς/g, 'σ')
    .replace(/α/g, 'a')
}
export function filterCourses(
  subjects: Subject[],
  semester: string,
  query = '',
) {
  const needle = normalizeCourseSearch(query.trim())
  return subjects.filter(
    (subject) =>
      (semester === 'all' ||
        subject.offerings?.some((o) => o.semester === Number(semester))) &&
      normalizeCourseSearch(
        `${subject.name} ${subject.name_en} ${subject.course_code ?? ''}`,
      ).includes(needle),
  )
}
export function validateAcademicSelection(
  input: { departmentId: string; entryYear: number; semester: number },
  currentYear = new Date().getFullYear(),
) {
  if (input.departmentId !== CIVIL_DEPARTMENT)
    throw new Error('Unsupported department')
  if (
    !Number.isInteger(input.entryYear) ||
    input.entryYear < 2014 ||
    input.entryYear > Math.min(currentYear, 2026)
  )
    throw new Error('This catalogue covers entry years 2014–2026 only')
  if (
    !Number.isInteger(input.semester) ||
    input.semester < 1 ||
    input.semester > 11
  )
    throw new Error('Invalid semester')
  return {
    department_id: CIVIL_DEPARTMENT,
    curriculum_id: CIVIL_CURRICULUM,
    entry_year: input.entryYear,
    semester: input.semester,
    degree: 'Πολιτικών Μηχανικών',
  }
}
// Negative IDs are local preview fixtures, never persisted or used by live mutations.
export const civilPreviewSubjects: Subject[] = catalogue.courses
  .filter((c) => c.selectable)
  .map((c, i) => ({
    id: -(i + 1),
    name: c.name,
    name_en: c.name,
    faculty: 'Πολιτικών Μηχανικών',
    department_id: CIVIL_DEPARTMENT,
    course_code: c.code,
    offerings: c.offerings,
  }))
