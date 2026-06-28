'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendApplicationStatusEmail } from '@/lib/email'
import { logFunnel } from '@/lib/funnel'

const ALLOWED_STATUSES = ['viewed', 'shortlisted', 'rejected', 'accepted'] as const
type AppStatus = (typeof ALLOWED_STATUSES)[number]

export async function updateApplicationStatus(formData: FormData) {
  const applicationId = formData.get('application_id') as string
  const status = formData.get('status') as string

  if (!applicationId || !ALLOWED_STATUSES.includes(status as AppStatus)) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // RLS policy "recruiter_update_applications" enforces ownership — this just fires the update
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId)

  if (error) {
    console.error('[dashboard/actions] updateApplicationStatus error:', error.message)
    return
  }

  revalidatePath('/entreprise/dashboard')
  revalidatePath('/entreprise/candidatures')

  // FUNNEL — candidature vue / mise en relation
  if (status === 'viewed' || status === 'accepted') {
    try {
      type AppIds = { talent_id: string; job_id: string; company_id: string }
      const supabaseFunnel = await createClient()
      const { data: appIds } = await supabaseFunnel
        .from('applications')
        .select('talent_id, job_id, job_postings(company_id)')
        .eq('id', applicationId)
        .maybeSingle<AppIds & { job_postings: { company_id: string } | null }>()
      if (appIds) {
        logFunnel(
          status === 'accepted' ? 'mise_en_relation' : 'candidature_vue',
          {
            talentId: appIds.talent_id,
            jobId:    appIds.job_id,
            companyId: (appIds as any).job_postings?.company_id ?? null,
          },
        )
      }
    } catch { /* non-bloquant */ }
  }

  // NOT-03 — notify talent of status change (non-blocking)
  try {
    type AppDetail = {
      talent_id: string
      talent_profiles: { first_name: string; user_id: string } | null
      job_postings: { title: string; company_profiles: { name: string } | null } | null
    }
    const { data: app } = await supabase
      .from('applications')
      .select(
        'talent_id, talent_profiles(first_name, user_id), job_postings(title, company_profiles(name))',
      )
      .eq('id', applicationId)
      .maybeSingle<AppDetail>()

    if (app?.talent_profiles && app?.job_postings) {
      const adminClient = createAdminClient()
      const { data: authUser } = await adminClient.auth.admin.getUserById(
        app.talent_profiles.user_id,
      )
      if (authUser.user?.email) {
        await sendApplicationStatusEmail({
          talentEmail: authUser.user.email,
          talentFirstName: app.talent_profiles.first_name,
          jobTitle: app.job_postings.title,
          companyName: app.job_postings.company_profiles?.name ?? '',
          status,
        })
      }

      // NOT-04 — in-app notification for the talent
      const statusLabels: Record<string, string> = {
        viewed: 'a consulté votre candidature',
        shortlisted: 'vous a présélectionné(e)',
        accepted: 'a accepté votre candidature',
        rejected: 'n\'a pas retenu votre candidature',
      }
      const adminSupabase = createAdminClient()
      await adminSupabase.from('notifications').insert({
        user_id: app.talent_profiles.user_id,
        type: 'application_status',
        title: `Candidature : ${status === 'accepted' ? '🎉 Acceptée !' : status === 'shortlisted' ? '⭐ Présélectionné(e)' : 'Mise à jour'}`,
        body: `${app.job_postings.company_profiles?.name ?? 'L\'entreprise'} ${statusLabels[status] ?? 'a mis à jour votre candidature'} pour « ${app.job_postings.title} »`,
        link: '/talent/candidatures',
      })
    }
  } catch (emailErr) {
    console.error('[dashboard/actions] status email error (non-blocking):', emailErr)
  }
}

export async function saveRecruiterNote(applicationId: string, note: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  // RLS "recruiter_update_applications" enforces company ownership
  const { error } = await supabase
    .from('applications')
    .update({ recruiter_note: note.trim() || null })
    .eq('id', applicationId)

  if (error) return { error: error.message }
  revalidatePath('/entreprise/candidatures')
  revalidatePath('/entreprise/dashboard')
  return {}
}
