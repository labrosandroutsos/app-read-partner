import { describe, expect, it } from 'vitest'
import {
  civilCatalogue,
  civilPreviewSubjects,
  filterCourses,
  validateAcademicSelection,
  CIVIL_DEPARTMENT,
} from '@/lib/academic-catalogue'

describe('Civil Engineering guide import', () => {
  it('preserves one identity per code and the guide’s semester/track offerings', () => {
    expect(civilCatalogue.courses).toHaveLength(105)
    expect(new Set(civilCatalogue.courses.map((c) => c.code)).size).toBe(105)
    expect(civilCatalogue.courses.flatMap((c) => c.offerings)).toHaveLength(133)
    expect(civilPreviewSubjects).toHaveLength(78)
    for (const course of civilCatalogue.courses) {
      expect(course.code).toMatch(/^CIV_\d+A?$/)
      expect(
        new Set(course.offerings.map((o) => `${o.semester}:${o.track}`)).size,
      ).toBe(course.offerings.length)
    }
  })
  it('reconciles the common-core credit totals against the guide', () => {
    for (let semester = 1; semester <= 8; semester++) {
      const total = civilCatalogue.courses
        .flatMap((c) => c.offerings)
        .filter((o) => o.semester === semester && o.track === 0)
        .reduce((sum, o) => sum + (o.ects ?? 0), 0)
      expect(total).toBe(semester === 8 ? 20 : 30)
    }
  })
  it('does not expose generic elective placeholders, internship or thesis as matching courses', () => {
    for (const c of civilCatalogue.courses.filter((c) => c.selectable)) {
      expect(
        c.offerings.every(
          (o) =>
            !['external_placeholder', 'internship', 'thesis'].includes(o.kind),
        ),
      ).toBe(true)
    }
  })
  it('retains cross-track restrictions and shared semester identities', () => {
    for (const code of ['CIV_8232A', 'CIV_8355A', 'CIV_9560A', 'CIV_8665A']) {
      expect(
        civilCatalogue.courses
          .find((c) => c.code === code)
          ?.offerings.some((o) => o.semester === 10 && o.other_tracks_only),
      ).toBe(true)
    }
    expect(
      civilCatalogue.courses.some(
        (c) => new Set(c.offerings.map((o) => o.semester)).size > 1,
      ),
    ).toBe(true)
  })
  it('supports accent-insensitive Greek search and either alphabet in course codes', () => {
    expect(
      filterCourses(civilPreviewSubjects, 'all', 'μαθηματικα').length,
    ).toBeGreaterThan(0)
    expect(
      filterCourses(civilPreviewSubjects, 'all', 'CIV_8232Α').map(
        (c) => c.course_code,
      ),
    ).toEqual(['CIV_8232A'])
    expect(filterCourses(civilPreviewSubjects, '1', 'CIV_8232A')).toHaveLength(
      0,
    )
    expect(filterCourses(civilPreviewSubjects, 'all')).toHaveLength(78)
  })
  it('retains generic subjects when no semester filter is selected', () => {
    const generic = [
      {
        id: 1,
        name: 'Μαθηματικά',
        name_en: 'Mathematics',
        faculty: 'Engineering',
      },
    ]
    expect(filterCourses(generic, 'all', 'math')).toEqual(generic)
  })
  it('rejects unsupported curricula instead of assigning them silently', () => {
    const valid = {
      departmentId: CIVIL_DEPARTMENT,
      entryYear: 2020,
      semester: 11,
    }
    expect(validateAcademicSelection(valid, 2026).curriculum_id).toBe(
      'upatras-civil-p3-2026',
    )
    for (const input of [
      { ...valid, entryYear: 1949 },
      { ...valid, entryYear: 2027 },
      { ...valid, departmentId: 'other' },
      { ...valid, semester: 0 },
      { ...valid, semester: 1.5 },
    ]) {
      expect(() => validateAcademicSelection(input, 2026)).toThrow()
    }
  })
})


describe('University-wide department selection', () => {
  it('keeps unsupported entry cohorts unassigned instead of inventing a curriculum', () => {
    expect(validateAcademicSelection({departmentId:CIVIL_DEPARTMENT,entryYear:2013,semester:13},2026).curriculum_id).toBeNull()
    expect(validateAcademicSelection({departmentId:'upatras-medicine',entryYear:2020,semester:12},2026)).toMatchObject({department_id:'upatras-medicine',curriculum_id:null,degree:'Ιατρικής'})
  })
})
