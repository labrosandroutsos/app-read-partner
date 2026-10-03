import { createClient } from '@/lib/supabase/server'
import type { Subject } from '@/lib/types'
import { CIVIL_CURRICULUM } from '@/lib/academic-catalogue'
export async function isCatalogueReady() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('curriculum_courses')
    .select('subject_id')
    .eq('curriculum_id', CIVIL_CURRICULUM)
    .limit(1)
  // Allows staged deployment before the additive catalogue migrations are applied.
  if (error && ['42P01', 'PGRST205'].includes(error.code)) return false
  if (error) throw error
  return Boolean(data?.length)
}
export async function getCurriculumSubjects(
  curriculumId: string,
): Promise<Subject[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('curriculum_courses')
    .select('offerings, subject:subjects(*)')
    .eq('curriculum_id', curriculumId)
  if (error) throw error
  return (data ?? [])
    .map((row) => ({
      ...(row.subject as unknown as Subject),
      offerings: row.offerings,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'el'))
}
