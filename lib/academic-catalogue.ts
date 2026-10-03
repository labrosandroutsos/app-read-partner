import directory from '@/data/catalogues/upatras-departments.json'
import physics from '@/data/catalogues/upatras-physics-2026.json'
import catalogue from '@/data/catalogues/upatras-civil-2026.json'
import type { Subject } from '@/lib/types'

export const departments = directory.departments
export const verifiedCatalogues = [catalogue, physics]
export function catalogueFor(departmentId: string, entryYear: number) {
  return verifiedCatalogues.find(
    (c) =>
      c.department.id === departmentId &&
      entryYear >= c.curriculum.entry_year_min &&
      entryYear <= c.curriculum.entry_year_max,
  )
}
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
  const department = departments.find((d) => d.id === input.departmentId)
  if (!department) throw new Error('Unsupported department')
  if (
    !Number.isInteger(input.entryYear) ||
    input.entryYear < 1950 ||
    input.entryYear > Math.min(currentYear, 2026)
  )
    throw new Error('Invalid entry year')
  if (
    !Number.isInteger(input.semester) ||
    input.semester < 1 ||
    input.semester > 13
  )
    throw new Error('Invalid semester')
  return {
    department_id: department.id,
    curriculum_id:
      catalogueFor(department.id, input.entryYear)?.curriculum.id ?? null,
    entry_year: input.entryYear,
    semester: input.semester,
    degree: department.name,
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
