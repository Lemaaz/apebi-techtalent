import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'noreply@techtalent-apebi.vercel.app'
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'APEBI TechTalent'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://techtalent-apebi.vercel.app'
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? 'techtalent@apebi.ma'

// ── HTML escaping — toujours appliquer sur les données utilisateur ───────────
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// ── Base layout ──────────────────────────────────────────────

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{font-family:system-ui,sans-serif;background:#f5f5f5;margin:0;padding:24px}
  .card{background:#fff;border-radius:12px;max-width:560px;margin:0 auto;padding:32px;border:1px solid #eaeaea}
  .header{border-bottom:1px solid #eaeaea;padding-bottom:16px;margin-bottom:24px}
  .logo{font-size:15px;font-weight:700;color:#202020}
  .logo span{color:#00AFD2}
  h1{font-size:20px;font-weight:700;color:#202020;margin:0 0 8px}
  p{font-size:14px;color:#545454;line-height:1.6;margin:0 0 12px}
  .btn{display:inline-block;background:#00AFD2;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px}
  .badge{display:inline-block;background:#00afd220;color:#00AFD2;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:12px}
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

function isResendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY
  return !!(key && !key.startsWith('re_['))
}

// ── NOT-02 : Nouvelle candidature → recruteur ────────────────

export async function sendNewApplicationEmail(params: {
  talentName: string
  jobTitle: string
  companyName: string
  recruiterEmails: string[]
}) {
  if (!isResendConfigured()) return
  const content = `
    <h1>Nouvelle candidature reçue</h1>
    <p><strong>${esc(params.talentName)}</strong> a postulé à votre offre :</p>
    <p class="badge">${esc(params.jobTitle)}</p>
    <p>Consultez le profil et la lettre de motivation depuis votre dashboard recruteur.</p>
    <a href="${APP_URL}/entreprise/dashboard" class="btn">Voir la candidature</a>
    <p style="margin-top:16px">Entreprise : <strong>${esc(params.companyName)}</strong></p>
  `
  const html = baseLayout('Nouvelle candidature', content)
  for (const email of params.recruiterEmails) {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM}>`,
      to: email,
      subject: `Nouvelle candidature — ${params.jobTitle}`,
      html,
    })
  }
}

// ── NOT-01 : Compte validé/rejeté → utilisateur ──────────────

export async function sendAccountStatusEmail(params: {
  userId: string
  role: 'talent' | 'entreprise'
  status: 'approved' | 'rejected'
  reason?: string | null
}) {
  if (!isResendConfigured()) return
  const adminClient = createAdminClient()
  const { data: authUser } = await adminClient.auth.admin.getUserById(params.userId)
  if (!authUser.user?.email) return

  let firstName = authUser.user.user_metadata?.first_name
    ?? authUser.user.email.split('@')[0]

  if (params.role === 'talent') {
    const { data: tp } = await adminClient
      .from('talent_profiles')
      .select('first_name')
      .eq('user_id', params.userId)
      .maybeSingle()
    if (tp?.first_name) firstName = tp.first_name
  } else {
    const { data: cm } = await adminClient
      .from('company_members')
      .select('company_profiles(name)')
      .eq('user_id', params.userId)
      .maybeSingle()
    if (cm) {
      const cp = cm as { company_profiles: { name: string } | null }
      if (cp.company_profiles?.name) firstName = cp.company_profiles.name
    }
  }

  if (params.status === 'approved') {
    const dashboardUrl = params.role === 'talent'
      ? `${APP_URL}/talent/profil`
      : `${APP_URL}/entreprise/dashboard`
    const content = `
      <h1>Votre compte est activé !</h1>
      <p>Bonjour <strong>${esc(firstName)}</strong>,</p>
      <p>Votre ${params.role === 'talent' ? 'profil talent' : 'compte entreprise'} sur <strong>APEBI TechTalent</strong> a été validé par l'équipe APEBI.</p>
      ${params.role === 'talent'
        ? "<p>Votre profil est maintenant visible auprès des entreprises membres APEBI. Vous pouvez commencer à postuler aux offres disponibles.</p>"
        : "<p>Vous pouvez désormais publier vos offres d'emploi et accéder au vivier de talents tech marocains.</p>"
      }
      <a href="${dashboardUrl}" class="btn">Accéder à mon espace</a>
    `
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM}>`,
      to: authUser.user.email,
      subject: 'Votre compte APEBI TechTalent est activé !',
      html: baseLayout('Compte activé', content),
    })
  } else {
    const content = `
      <h1>Mise à jour de votre demande</h1>
      <p>Bonjour <strong>${esc(firstName)}</strong>,</p>
      <p>Votre demande d'accès à APEBI TechTalent a été examinée par l'équipe APEBI.</p>
      ${params.reason ? `<p>Motif : <em>${esc(params.reason)}</em></p>` : ''}
      <p>Pour plus d'informations, contactez-nous à <a href="mailto:techtalent@apebi.ma" style="color:#00AFD2">techtalent@apebi.ma</a>.</p>
    `
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM}>`,
      to: authUser.user.email,
      subject: 'Mise à jour de votre demande APEBI TechTalent',
      html: baseLayout('Mise à jour de votre demande', content),
    })
  }
}

// ── NOT-03 : Changement statut candidature → talent ──────────

export async function sendApplicationStatusEmail(params: {
  talentEmail: string
  talentFirstName: string
  jobTitle: string
  companyName: string
  status: string
}) {
  if (!isResendConfigured()) return

  const messages: Record<string, { subject: string; body: string }> = {
    viewed: {
      subject: 'Votre candidature a été consultée',
      body: `<p>Bonne nouvelle ! <strong>${esc(params.companyName)}</strong> a consulté votre candidature pour le poste de <strong>${esc(params.jobTitle)}</strong>.</p>`,
    },
    shortlisted: {
      subject: 'Vous êtes présélectionné(e) !',
      body: `<p>Félicitations ! <strong>${esc(params.companyName)}</strong> vous a présélectionné(e) pour <strong>${esc(params.jobTitle)}</strong>. Attendez-vous à être contacté(e) prochainement.</p>`,
    },
    accepted: {
      subject: 'Votre candidature a été acceptée !',
      body: `<p>Excellente nouvelle ! <strong>${esc(params.companyName)}</strong> a accepté votre candidature pour <strong>${esc(params.jobTitle)}</strong>.</p>`,
    },
    rejected: {
      subject: 'Mise à jour de votre candidature',
      body: `<p><strong>${esc(params.companyName)}</strong> n'a pas retenu votre candidature pour <strong>${esc(params.jobTitle)}</strong>. Continuez à explorer les offres disponibles !</p>`,
    },
  }

  const msg = messages[params.status] ?? {
    subject: 'Mise à jour de votre candidature',
    body: `<p>Votre candidature pour <strong>${esc(params.jobTitle)}</strong> chez <strong>${esc(params.companyName)}</strong> a été mise à jour.</p>`,
  }

  const content = `
    <h1>${esc(msg.subject)}</h1>
    <p>Bonjour <strong>${esc(params.talentFirstName)}</strong>,</p>
    ${msg.body}
    <a href="${APP_URL}/talent/candidatures" class="btn">Voir mes candidatures</a>
  `
  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to: params.talentEmail,
    subject: msg.subject,
    html: baseLayout(msg.subject, content),
  })
}

// ── NOT-00 : Profil soumis → utilisateur (confirmation) ─────────────────────

export async function sendProfileSubmittedEmail(params: {
  toEmail: string
  firstName: string
  role: 'talent' | 'entreprise'
}) {
  if (!isResendConfigured()) return

  const isEntreprise = params.role === 'entreprise'
  const dashboardUrl = isEntreprise ? `${APP_URL}/entreprise/dashboard` : `${APP_URL}/talent/profil`

  const content = `
    <h1>Votre ${isEntreprise ? 'demande' : 'profil'} a bien été reçu !</h1>
    <p>Bonjour <strong>${esc(params.firstName)}</strong>,</p>
    <p>Merci d'avoir rejoint <strong>APEBI TechTalent</strong>. ${
      isEntreprise
        ? "Votre demande d'accès entreprise a été transmise à l'équipe APEBI pour validation."
        : 'Votre profil talent a été soumis à l\'équipe APEBI pour validation.'
    }</p>
    <p>Nous vous informerons par email dès que votre compte sera validé (généralement sous 48–72 heures ouvrées).</p>
    <a href="${dashboardUrl}" class="btn">Voir mon espace</a>
    <p style="margin-top:16px;font-size:13px;color:#797979">Des questions ? Contactez-nous à <a href="mailto:techtalent@apebi.ma" style="color:#00AFD2">techtalent@apebi.ma</a></p>
  `

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to: params.toEmail,
    subject: `Votre ${isEntreprise ? 'demande' : 'profil'} APEBI TechTalent est en cours de validation`,
    html: baseLayout('Demande reçue', content),
  })
}

// ── NOT-00b : Nouveau profil → admin APEBI (alerte validation) ───────────────

export async function sendAdminNewProfileEmail(params: {
  role: 'talent' | 'entreprise'
  name: string
  adminReviewUrl: string
}) {
  if (!isResendConfigured()) return

  const label = params.role === 'talent' ? 'Nouveau talent' : 'Nouvelle entreprise'

  const content = `
    <h1>${label} en attente de validation</h1>
    <p>Un nouveau ${params.role === 'talent' ? 'talent' : 'compte entreprise'} vient de s'inscrire sur APEBI TechTalent et attend votre validation :</p>
    <p class="badge">${esc(params.name)}</p>
    <a href="${esc(params.adminReviewUrl)}" class="btn">Examiner le profil</a>
  `

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to: ADMIN_EMAIL,
    subject: `[TechTalent] ${label} à valider — ${params.name}`,
    html: baseLayout(`${label} à valider`, content),
  })
}
