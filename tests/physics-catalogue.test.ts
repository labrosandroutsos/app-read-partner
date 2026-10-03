import { describe, it, expect } from 'vitest'
import physics from '@/data/catalogues/upatras-physics-2026.json'
import {
  catalogueFor,
  departments,
  validateAcademicSelection,
} from '@/lib/academic-catalogue'

describe('Physics 2026–27 and department directory', () => {
  it('lists all 31 departments with unique identities and sourced campus locations', () => {
    expect(departments).toHaveLength(31)
    expect(new Set(departments.map((d) => d.id)).size).toBe(31)
    expect(new Set(departments.map((d) => d.school)).size).toBe(7)
    expect(
      departments.every(
        (d) => d.campus && d.url.startsWith('https://www.upatras.gr/'),
      ),
    ).toBe(true)
  })
  it('preserves source codes and reconciles common-core semester totals', () => {
    expect(physics.courses).toHaveLength(88)
    expect(physics.courses.filter((c) => c.selectable)).toHaveLength(80)
    expect(new Set(physics.courses.map((c) => c.code)).size).toBe(88)
    for (let semester = 1; semester <= 6; semester++)
      expect(
        physics.courses.reduce(
          (total, c) =>
            total +
            c.offerings
              .filter((o) => o.semester === semester)
              .reduce((sum, o) => sum + (o.ects ?? 0), 0),
          0,
        ),
      ).toBe(30)
  })
  it('excludes non-taught courses, theses and internship from current matching', () => {
    for (const code of ['PHE440', 'TAE503', 'NME502', 'MSE417'])
      expect(physics.courses.find((c) => c.code === code)?.selectable).toBe(
        false,
      )
    expect(physics.courses.find((c) => c.code === 'EEE423')?.selectable).toBe(
      true,
    )
  })
  it('assigns the Physics curriculum only to its documented entry cohorts', () => {
    expect(catalogueFor('upatras-physics', 2015)).toBeUndefined()
    expect(
      validateAcademicSelection(
        { departmentId: 'upatras-physics', entryYear: 2016, semester: 13 },
        2026,
      ).curriculum_id,
    ).toBe('upatras-physics-2016-2026')
    expect(catalogueFor('upatras-civil', 2014)?.department.id).toBe(
      'upatras-civil',
    )
  })
})
