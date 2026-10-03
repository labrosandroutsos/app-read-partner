'use server'
import { createClient } from '@/lib/supabase/server'
import { validateAcademicSelection } from '@/lib/academic-catalogue'
import { revalidatePath } from 'next/cache'
export async function saveAcademicProfile(input: {
  departmentId: string
  entryYear: number
  semester: number
}) {
  const selection = validateAcademicSelection(input)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const {data: department, error: departmentError} = await supabase.from('departments').select('id').eq('id',selection.department_id).single()
  if (departmentError || !department) throw new Error('Department is unavailable')
  if (selection.curriculum_id) {
    const { data: curriculum, error: catalogueError } = await supabase.from('curricula').select('id').eq('id',selection.curriculum_id).single()
    if (catalogueError || !curriculum) throw new Error('Catalogue is unavailable')
  }
  const { data, error } = await supabase
    .from('profiles')
    .update(selection)
    .eq('id', user.id)
    .select('id')
    .single()
  if (error || !data) throw new Error('Unable to save academic profile')
  revalidatePath('/app')
}
