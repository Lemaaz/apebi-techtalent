'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  job_id: z.string().uuid('Offre invalide'),
  cover_letter: z
    .string()
    .max(1000, 'Lettre de motivation max 1 000 caractères')
    .optional(),
})

export type ApplyState = { error: string | null; success: boolean }

export async function applyToJob(
  _: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const parsed = schema.safeParse({
    job_id: formData.get('job_id'),
    cover_letter: (formData.get('cover_letter') as string) || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides', success: false }
  }

  // Verify talent profile exists
  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!talent) {
    return {
      error: 'Créez votre profil talent avant de postuler.',
      success: false,
    }
  }

  // Verify job is still active
  const { data: job } = await supabase
    .from('job_postings')
    .select('id, applications_count')
    .eq('id', parsed.data.job_id)
    .eq('status', 'active')
    .maybeSingle()

  if (!job) {
    return { error: "Cette offre n'est plus disponible.", success: false }
  }

  // Insert application
  const { error } = await supabase.from('applications').insert({
    job_id: parsed.data.job_id,
    talent_id: talent.id,
    cover_letter: parsed.data.cover_letter,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Vous avez déjà postulé à cette offre.', success: false }
    }
    return { error: 'Erreur lors de la candidature. Réessayez.', success: false }
  }

  // Increment applications_count
  await supabase
    .from('job_postings')
    .update({ applications_count: (job.applications_count ?? 0) + 1 })
    .eq('id', job.id)

  revalidatePath(`/offres`)

  return { error: null, success: true }
}
