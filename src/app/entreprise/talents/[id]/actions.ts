'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendInvitationEmail } from '@/lib/email'
import { logFunnel } from '@/lib/funnel'

export async function inviterAPostuler(
  talentId: string,
  jobId: string,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()

    // Auth — recruteur de l'entreprise
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non authentifié' }

    const { data: member } = await supabase
      .from('company_members')
      .select('company_id, company_profiles ( name )')
      .eq('user_id', user.id)
      .maybeSingle<{ company_id: string; company_profiles: { name: string } | null }>()

    if (!member) return { success: false, error: 'Accès refusé' }

    const companyName = member.company_profiles?.name ?? 'Entreprise APEBI'

    // Vérifier que l'offre appartient à cette entreprise et est active
    const { data: job } = await supabase
      .from('job_postings')
      .select('id, title, slug, status')
      .eq('id', jobId)
      .eq('company_id', member.company_id)
      .eq('status', 'active')
      .maybeSingle()

    if (!job) return { success: false, error: 'Offre introuvable ou inactive' }

    // Récupérer le profil talent (vérifie qu'il est validé et visible)
    const { data: talent } = await supabase
      .from('talent_profiles')
      .select('id, first_name, last_name, user_id, validation_status, visibility')
      .eq('id', talentId)
      .eq('validation_status', 'approved')
      .eq('visibility', true)
      .maybeSingle()

    if (!talent) return { success: false, error: 'Profil talent introuvable' }

    // Récupérer l'email du talent via service role
    const { data: authUser } = await admin.auth.admin.getUserById(talent.user_id)
    if (!authUser.user?.email) return { success: false, error: 'Email talent non disponible' }

    // Envoyer l'email via lib/email.ts (pattern unifié)
    await sendInvitationEmail({
      toEmail: authUser.user.email,
      talentFirstName: talent.first_name,
      companyName,
      jobTitle: job.title,
      jobSlug: job.slug,
      message: message.trim() || null,
    })

    // Créer une notification in-app
    await supabase.from('notifications').insert({
      user_id: talent.user_id,
      type: 'invitation',
      title: `${companyName} vous invite à postuler`,
      body: `Pour le poste : ${job.title}`,
      link: `/offres/${job.slug}`,
    })

    // FUNNEL — invitation envoyée
    logFunnel('invitation_envoyee', {
      talentId: talent.id,
      userId:   user.id,
      jobId:    job.id,
      companyId: member.company_id,
    })

    revalidatePath(`/entreprise/talents/${talentId}`)
    return { success: true }
  } catch (err) {
    console.error('[inviterAPostuler]', err)
    return { success: false, error: 'Erreur lors de l\'envoi de l\'invitation' }
  }
}

export async function getCompanyActiveJobs(): Promise<
  Array<{ id: string; title: string; slug: string; city: string | null }>
> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: member } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member) return []

    const { data: jobs } = await supabase
      .from('job_postings')
      .select('id, title, slug, city')
      .eq('company_id', member.company_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    return jobs ?? []
  } catch {
    return []
  }
}
