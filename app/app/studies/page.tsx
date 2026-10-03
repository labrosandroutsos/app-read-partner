import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/data'
import { isCatalogueReady } from '@/lib/academic-data'
import { AcademicSetup } from '@/components/academics/academic-setup'
export default async function StudiesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  if (!(await isCatalogueReady()))
    return (
      <main className="mx-auto max-w-lg p-6">
        <h1 className="study-title text-2xl">
          Ο κατάλογος μαθημάτων ετοιμάζεται
        </h1>
        <p className="my-4">
          Τα μαθήματα του τμήματος θα είναι σύντομα διαθέσιμα.
        </p>
        <a href="/app" className="text-primary underline">
          Επιστροφή στην εφαρμογή
        </a>
      </main>
    )
  return <AcademicSetup profile={await getProfile(user.id)} />
}
