'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendApplicationStatusEmail } from '@/lib/email'

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
    }
  } catch (emailErr) {
    console.error('[dashboard/actions] status email error (non-blocking):', emailErr)
  }
}
