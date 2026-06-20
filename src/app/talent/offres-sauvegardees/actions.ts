'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ── OFF-06 : Sauvegarder / retirer une offre côté talent ─────

export async function toggleSavedJob(jobId: string, isSaved: boolean): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!talent) return

  if (isSaved) {
    await supabase
      .from('saved_jobs')
      .delete()
      .eq('talent_id', talent.id)
      .eq('job_id', jobId)
  } else {
    await supabase
      .from('saved_jobs')
      .insert({ talent_id: talent.id, job_id: jobId })
  }

  revalidatePath('/offres')
  revalidatePath('/talent/offres-sauvegardees')
}
