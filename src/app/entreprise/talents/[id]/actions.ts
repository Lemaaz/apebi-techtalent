'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logFunnel } from '@/lib/funnel'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'noreply@techtalent-apebi.vercel.app'
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'APEBI TechTalent'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://techtalent-apebi.vercel.app'

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

function invitationEmail(
  talentFirstName: string,
  companyName: string,
  jobTitle: string,
  jobSlug: string,
  message: string | null,
): string {
  const jobUrl = `${APP_URL}/offres/${esc(jobSlug)}`
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invitation à postuler</title>
<style>
  body{font-family:Hind,system-ui,sans-serif;background:#f5f5f5;margin:0;padding:24px}
  .card{background:#fff;border-radius:12px;max-width:560px;margin:0 auto;padding:32px;border:1px solid #eaeaea}
  .header{border-bottom:1px solid #eaeaea;padding-bottom:16px;margin-bottom:24px}
  .logo{font-size:15px;font-weight:700;color:#202020}.logo span{color:#00AFD2}
  h1{font-size:20px;font-weight:700;color:#202020;margin:0 0 8px}
  p{font-size:14px;color:#545454;line-height:1.6;margin:0 0 12px}
  .company{font-weight:700;color:#202020}
  .job-box{background:#f0fafd;border:1px solid #00afd230;border-radius:8px;padding:12px 16px;margin:16px 0}
  .job-title{font-size:15px;font-weight:700;color:#00AFD2}
  .message-box{background:#f9f9f9;border-left:3px solid #00AFD2;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;font-style:italic;color:#545454}
  .btn{display:inline-block;background:#00AFD2;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px}
  .footer{margin-top:24px;padding-top:16px;border-top:1px solid #eaeaea;font-size:12px;color:#797979}
</style>
</head>
<body>
<div class="card">
  <div class="header"><div class="logo">APEBI <span>Tech</span>Talent</div></div>
  <h1>Invitation à postuler</h1>
  <p>Bonjour <strong>${esc(talentFirstName)}</strong>,</p>
  <p>Votre profil sur APEBI TechTalent a retenu l'attention de <span class="company">${esc(companyName)}</span>.</p>
  <div class="job-box">
    <p class="job-title">${esc(jobTitle)}</p>
    <p style="margin:4px 0 0;font-size:12px;color:#797979">Offre publiée sur APEBI TechTalent</p>
  </div>
  ${message ? `<div class="message-box">"${esc(message)}"</div>` : ''}
  <p>Consultez l'offre et postulez directement depuis la plateforme :</p>
  <a href="${jobUrl}" class="btn">Voir l'offre et postuler</a>
  <div class="footer">
    <p>Cet email vous a été envoyé via APEBI TechTalent · <a href="${APP_URL}" style="color:#00AFD2">techtalent-apebi.vercel.app</a></p>
    <p>Vous recevez ce message car votre profil est visible sur la plateforme. Pour le masquer : <a href="${APP_URL}/talent/profil" style="color:#00AFD2">gérer ma visibilité</a>.</p>
  </div>
</div>
</body></html>`
}

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

    const html = invitationEmail(
      talent.first_name,
      companyName,
      job.title,
      job.slug,
      message.trim() || null,
    )

    // Envoyer l'email
    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_[')) {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM}>`,
        to: authUser.user.email,
        subject: `${companyName} vous invite à postuler — ${job.title}`,
        html,
      })
    }

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
