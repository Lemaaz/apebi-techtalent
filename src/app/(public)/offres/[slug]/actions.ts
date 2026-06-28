'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendNewApplicationEmail } from '@/lib/email'
import { logFunnel } from '@/lib/funnel'

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

  // FUNNEL — candidature envoyée
  logFunnel('candidature_envoyee', { talentId: talent.id, userId: user.id, jobId: parsed.data.job_id })

  // Increment applications_count
  await supabase
    .from('job_postings')
    .update({ applications_count: (job.applications_count ?? 0) + 1 })
    .eq('id', job.id)

  revalidatePath(`/offres`)

  // NOT-02 — email au(x) recruteur(s) de l'entreprise
  try {
    const adminClient = createAdminClient()
    const { data: jobFull } = await supabase
      .from('job_postings')
      .select('title, company_id, company_profiles(name)')
      .eq('id', parsed.data.job_id)
      .maybeSingle<{ title: string; company_id: string; company_profiles: { name: string } | null }>()

    const { data: talentProfile } = await supabase
      .from('talent_profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle()

    if (jobFull && talentProfile) {
      const { data: members } = await supabase
        .from('company_members')
        .select('user_id, notify_on_application')
        .eq('company_id', jobFull.company_id)

      const allMemberIds = (members ?? []).map((m) => m.user_id)
      // Only email recruiters who opted in (default true — migration 016)
      const notifyIds = (members ?? [])
        .filter((m) => m.notify_on_application !== false)
        .map((m) => m.user_id)

      if (notifyIds.length > 0) {
        const { data: authUsers } = await adminClient.auth.admin.listUsers()
        const recruiterEmails = authUsers.users
          .filter((u) => notifyIds.includes(u.id) && !!u.email)
          .map((u) => u.email as string)

        await sendNewApplicationEmail({
          talentName: `${talentProfile.first_name} ${talentProfile.last_name}`,
          jobTitle: jobFull.title,
          companyName: jobFull.company_profiles?.name ?? '',
          recruiterEmails,
        })
      }

      // NOT-04 — in-app notification for ALL recruiters (regardless of email pref)
      if (allMemberIds.length > 0) {
        const adminSupabase = createAdminClient()
        await adminSupabase.from('notifications').insert(
          allMemberIds.map((uid) => ({
            user_id: uid,
            type: 'new_application',
            title: 'Nouvelle candidature',
            body: `${talentProfile.first_name} ${talentProfile.last_name} a postulé à « ${jobFull.title} »`,
            link: '/entreprise/candidatures?tab=a-traiter',
          }))
        )
      }
    }
  } catch (emailErr) {
    console.error('[applyToJob] email error (non-blocking):', emailErr)
  }

  return { error: null, success: true }
}
