import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'noreply@techtalent-apebi.vercel.app'
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'APEBI TechTalent'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://techtalent-apebi.vercel.app'

// ── HTML escaping — toujours appliquer sur les données utilisateur ────────────
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// ── Email templates ──────────────────────────────────────────

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{font-family:Hind,system-ui,sans-serif;background:#f5f5f5;margin:0;padding:24px}
  .card{background:#fff;border-radius:12px;max-width:560px;margin:0 auto;padding:32px;border:1px solid #eaeaea}
  .header{border-bottom:1px solid #eaeaea;padding-bottom:16px;margin-bottom:24px}
  .logo{font-size:15px;font-weight:700;color:#202020}
  .logo span{color:#00AFD2}
  h1{font-size:20px;font-weight:700;color:#202020;margin:0 0 8px}
  p{font-size:14px;color:#545454;line-height:1.6;margin:0 0 12px}
  .btn{display:inline-block;background:#00AFD2;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px}
  .badge{display:inline-block;background:#00afd220;color:#00AFD2;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600}
  .footer{margin-top:24px;padding-top:16px;border-top:1px solid #eaeaea;font-size:12px;color:#797979}
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo">APEBI <span>Tech</span>Talent</div>
  </div>
  ${content}
  <div class="footer">
    <p>Cet email a été envoyé par APEBI TechTalent · <a href="${APP_URL}" style="color:#00AFD2">techtalent-apebi.vercel.app</a></p>
  </div>
</div>
</body></html>`
}

function newApplicationEmail(talentName: string, jobTitle: string, companyName: string, applicationUrl: string): string {
  const content = `
    <h1>Nouvelle candidature reçue</h1>
    <p><strong>${esc(talentName)}</strong> a postulé à votre offre :</p>
    <p class="badge">${esc(jobTitle)}</p>
    <p>Consultez le profil et la lettre de motivation de ce talent directement depuis votre dashboard recruteur.</p>
    <a href="${esc(applicationUrl)}" class="btn">Voir la candidature</a>
    <p style="margin-top:16px">Entreprise : <strong>${esc(companyName)}</strong></p>
  `
  return baseLayout('Nouvelle candidature', content)
}

function accountValidatedEmail(firstName: string, role: 'talent' | 'entreprise'): string {
  const dashboardUrl = role === 'talent' ? `${APP_URL}/talent/profil` : `${APP_URL}/entreprise/dashboard`
  const content = `
    <h1>Votre compte est activé !</h1>
    <p>Bonjour <strong>${esc(firstName)}</strong>,</p>
    <p>Votre ${role === 'talent' ? 'profil talent' : 'compte entreprise'} sur <strong>APEBI TechTalent</strong> a été validé par l'équipe APEBI.</p>
    ${role === 'talent'
      ? '<p>Votre profil est maintenant visible auprès des entreprises membres APEBI. Vous pouvez commencer à postuler aux offres disponibles.</p>'
      : '<p>Vous pouvez désormais publier vos offres d\'emploi et accéder au vivier de talents tech marocains.</p>'
    }
    <a href="${esc(dashboardUrl)}" class="btn">Accéder à mon espace</a>
  `
  return baseLayout('Compte activé', content)
}

function accountRejectedEmail(firstName: string, reason: string | null): string {
  const content = `
    <h1>Mise à jour de votre demande</h1>
    <p>Bonjour <strong>${esc(firstName)}</strong>,</p>
    <p>Votre demande d'accès à APEBI TechTalent a été examinée par l'équipe APEBI.</p>
    ${reason ? `<p>Motif : <em>${esc(reason)}</em></p>` : ''}
    <p>Pour plus d'informations ou pour soumettre une nouvelle demande, contactez-nous à <a href="mailto:techtalent@apebi.ma" style="color:#00AFD2">techtalent@apebi.ma</a>.</p>
  `
  return baseLayout('Mise à jour de votre demande', content)
}

function applicationStatusEmail(firstName: string, jobTitle: string, status: string, companyName: string): string {
  const safeCompany = esc(companyName)
  const safeJob = esc(jobTitle)

  const statusMessages: Record<string, { subject: string; body: string }> = {
    viewed: {
      subject: 'Votre candidature a été consultée',
      body: `<p>Bonne nouvelle ! <strong>${safeCompany}</strong> a consulté votre candidature pour le poste de <strong>${safeJob}</strong>.</p>`,
    },
    shortlisted: {
      subject: 'Vous êtes présélectionné(e) !',
      body: `<p>Félicitations ! <strong>${safeCompany}</strong> vous a présélectionné(e) pour le poste de <strong>${safeJob}</strong>. Attendez-vous à être contacté(e) prochainement.</p>`,
    },
    accepted: {
      subject: 'Votre candidature a été acceptée !',
      body: `<p>Excellente nouvelle ! <strong>${safeCompany}</strong> a accepté votre candidature pour le poste de <strong>${safeJob}</strong>. L'équipe RH va vous contacter pour la suite du processus.</p>`,
    },
    rejected: {
      subject: 'Mise à jour de votre candidature',
      body: `<p><strong>${safeCompany}</strong> a examiné votre candidature pour le poste de <strong>${safeJob}</strong> et a décidé de ne pas donner suite. Continuez à explorer les offres disponibles !</p>`,
    },
  }

  const msg = statusMessages[status] ?? {
    subject: 'Mise à jour de votre candidature',
    body: `<p>Votre candidature pour le poste de <strong>${safeJob}</strong> chez <strong>${safeCompany}</strong> a été mise à jour.</p>`,
  }

  const content = `
    <h1>${esc(msg.subject)}</h1>
    <p>Bonjour <strong>${esc(firstName)}</strong>,</p>
    ${msg.body}
    <a href="${APP_URL}/talent/candidatures" class="btn">Voir mes candidatures</a>
  `
  return baseLayout(msg.subject, content)
}

// ── Route handler ────────────────────────────────────────────

type EmailPayload =
  | { type: 'new_application'; talentId: string; jobId: string }
  | { type: 'account_validated'; userId: string; role: 'talent' | 'entreprise' }
  | { type: 'account_rejected'; userId: string; role: 'talent' | 'entreprise'; reason?: string }
  | { type: 'application_status'; applicationId: string; status: string }

export async function POST(req: NextRequest) {
  // Internal route — only callable server-side via service role or validated admin action
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isAdmin = user
    ? (await supabase.rpc('is_admin')).data === true
    : false

  if (!user || !isAdmin) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_[')) {
    return NextResponse.json({ error: 'RESEND_API_KEY non configurée' }, { status: 503 })
  }

  const payload = (await req.json()) as EmailPayload
  const adminClient = createAdminClient()

  try {
    switch (payload.type) {
      case 'new_application': {
        const { data: app } = await supabase
          .from('applications')
          .select(`
            job_postings ( title, company_id, company_profiles ( name ) ),
            talent_profiles ( first_name, last_name )
          `)
          .eq('job_id', payload.jobId)
          .eq('talent_id', payload.talentId)
          .maybeSingle<{
            job_postings: { title: string; company_id: string; company_profiles: { name: string } | null } | null
            talent_profiles: { first_name: string; last_name: string } | null
          }>()

        if (!app?.job_postings || !app?.talent_profiles) break

        const recruiterEmails = await supabase
          .from('company_members')
          .select('user_id')
          .eq('company_id', app.job_postings.company_id)

        const recruiterIds = (recruiterEmails.data ?? []).map((m: { user_id: string }) => m.user_id)
        if (recruiterIds.length === 0) break

        const { data: authUsers } = await adminClient.auth.admin.listUsers()
        const emails = authUsers.users
          .filter((u) => recruiterIds.includes(u.id))
          .map((u) => u.email)
          .filter(Boolean) as string[]

        const talentName = `${app.talent_profiles.first_name} ${app.talent_profiles.last_name}`
        const html = newApplicationEmail(
          talentName,
          app.job_postings.title,
          app.job_postings.company_profiles?.name ?? '',
          `${APP_URL}/entreprise/dashboard`,
        )

        for (const email of emails) {
          await resend.emails.send({
            from: `${FROM_NAME} <${FROM}>`,
            to: email,
            subject: `Nouvelle candidature — ${app.job_postings.title}`,
            html,
          })
        }
        break
      }

      case 'account_validated': {
        const { data: authUser } = await adminClient.auth.admin.getUserById(payload.userId)
        if (!authUser.user?.email) break

        let firstName = authUser.user.user_metadata?.first_name ?? authUser.user.email.split('@')[0]
        if (payload.role === 'talent') {
          const { data: tp } = await supabase
            .from('talent_profiles')
            .select('first_name')
            .eq('user_id', payload.userId)
            .maybeSingle()
          if (tp) firstName = tp.first_name
        }

        const html = accountValidatedEmail(firstName, payload.role)
        await resend.emails.send({
          from: `${FROM_NAME} <${FROM}>`,
          to: authUser.user.email,
          subject: 'Votre compte APEBI TechTalent est activé !',
          html,
        })
        break
      }

      case 'account_rejected': {
        const { data: authUser } = await adminClient.auth.admin.getUserById(payload.userId)
        if (!authUser.user?.email) break

        let firstName = authUser.user.email.split('@')[0]
        if (payload.role === 'talent') {
          const { data: tp } = await supabase
            .from('talent_profiles')
            .select('first_name')
            .eq('user_id', payload.userId)
            .maybeSingle()
          if (tp) firstName = tp.first_name
        }

        const html = accountRejectedEmail(firstName, payload.reason ?? null)
        await resend.emails.send({
          from: `${FROM_NAME} <${FROM}>`,
          to: authUser.user.email,
          subject: 'Mise à jour de votre demande APEBI TechTalent',
          html,
        })
        break
      }

      case 'application_status': {
        const { data: app } = await supabase
          .from('applications')
          .select(`
            status,
            job_postings ( title, company_profiles ( name ) ),
            talent_profiles ( first_name, user_id )
          `)
          .eq('id', payload.applicationId)
          .maybeSingle<{
            status: string
            job_postings: { title: string; company_profiles: { name: string } | null } | null
            talent_profiles: { first_name: string; user_id: string } | null
          }>()

        if (!app?.talent_profiles || !app?.job_postings) break

        const { data: authUser } = await adminClient.auth.admin.getUserById(app.talent_profiles.user_id)
        if (!authUser.user?.email) break

        const html = applicationStatusEmail(
          app.talent_profiles.first_name,
          app.job_postings.title,
          payload.status,
          app.job_postings.company_profiles?.name ?? '',
        )

        await resend.emails.send({
          from: `${FROM_NAME} <${FROM}>`,
          to: authUser.user.email,
          subject: `Mise à jour de votre candidature — ${app.job_postings.title}`,
          html,
        })
        break
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[email] Error:', err)
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
  }
}
