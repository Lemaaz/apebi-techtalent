import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM      ?? 'noreply@techtalent-apebi.vercel.app'
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'APEBI TechTalent'
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://techtalent-apebi.vercel.app'

// ── Token unsubscribe (HMAC — sans colonne DB) ────────────────
function unsubToken(profileId: string): string {
  const secret = process.env.CRON_SECRET ?? 'fallback'
  return createHmac('sha256', secret).update(profileId).digest('hex').slice(0, 32)
}

function unsubUrl(profileId: string): string {
  return `${APP_URL}/api/unsubscribe?id=${profileId}&token=${unsubToken(profileId)}`
}

// ── Email template ────────────────────────────────────────────

function esc(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#x27;')
}

type JobAlert = { title: string; slug: string; company: string; city: string | null; contract: string }

function alertEmail(firstName: string, jobs: JobAlert[], profileId: string): string {
  const jobRows = jobs.map((j) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0">
        <a href="${APP_URL}/offres/${esc(j.slug)}" style="font-size:14px;font-weight:700;color:#00AFD2;text-decoration:none">${esc(j.title)}</a>
        <p style="margin:3px 0 0;font-size:12px;color:#797979">${esc(j.company)}${j.city ? ` · ${esc(j.city)}` : ''} · ${esc(j.contract)}</p>
      </td>
      <td style="padding:12px 0 12px 12px;border-bottom:1px solid #f0f0f0;vertical-align:middle;white-space:nowrap">
        <a href="${APP_URL}/offres/${esc(j.slug)}" style="display:inline-block;background:#00AFD2;color:#fff;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none">Voir</a>
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nouvelles offres</title></head>
<body style="font-family:Hind,system-ui,sans-serif;background:#f5f5f5;margin:0;padding:24px">
<div style="background:#fff;border-radius:12px;max-width:560px;margin:0 auto;padding:32px;border:1px solid #eaeaea">
  <div style="border-bottom:1px solid #eaeaea;padding-bottom:16px;margin-bottom:24px">
    <span style="font-size:15px;font-weight:700;color:#202020">APEBI <span style="color:#00AFD2">Tech</span>Talent</span>
  </div>
  <h1 style="font-size:20px;font-weight:700;color:#202020;margin:0 0 6px">
    ${jobs.length} nouvelle${jobs.length > 1 ? 's' : ''} offre${jobs.length > 1 ? 's' : ''} pour vous
  </h1>
  <p style="font-size:14px;color:#545454;margin:0 0 20px">
    Bonjour <strong>${esc(firstName)}</strong>, des offres correspondant à votre profil viennent d'être publiées sur APEBI TechTalent.
  </p>
  <table style="width:100%;border-collapse:collapse">${jobRows}</table>
  <div style="margin-top:24px;text-align:center">
    <a href="${APP_URL}/offres" style="display:inline-block;background:#00AFD2;color:#fff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">
      Voir toutes les offres →
    </a>
  </div>
  <div style="margin-top:28px;padding-top:16px;border-top:1px solid #eaeaea;font-size:12px;color:#797979">
    <p style="margin:0">Vous recevez ces alertes car votre profil APEBI TechTalent est actif et visible.</p>
    <p style="margin:6px 0 0"><a href="${unsubUrl(profileId)}" style="color:#00AFD2">Se désabonner des alertes offres</a></p>
  </div>
</div>
</body></html>`
}

// ── Types ─────────────────────────────────────────────────────

type TalentRow = {
  id: string
  user_id: string
  first_name: string
  last_alerted_at: string | null
  talent_skills: Array<{ skill_id: string }>
}

type JobRow = {
  id: string
  title: string
  slug: string
  city: string | null
  contract_type: string
  published_at: string | null
  job_skills: Array<{ skill_id: string }>
  company_profiles: { name: string } | null
}

// ── Cron handler ──────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET missing' }, { status: 500 })
  if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createAdminClient()

    // Fenêtre : offres publiées dans les dernières 2h10
    // (cron toutes les 2h, +10min de tolérance pour les gaps)
    const windowMs = 2 * 60 * 60 * 1000 + 10 * 60 * 1000
    const since = new Date(Date.now() - windowMs).toISOString()

    // Offres actives publiées dans la fenêtre
    const { data: newJobs, error: jobsErr } = await supabase
      .from('job_postings')
      .select('id, title, slug, city, contract_type, published_at, job_skills ( skill_id ), company_profiles ( name )')
      .eq('status', 'active')
      .gte('published_at', since)
      .limit(20)
      .returns<JobRow[]>()

    if (jobsErr) throw jobsErr
    if (!newJobs || newJobs.length === 0) {
      return NextResponse.json({ ok: true, jobs: 0, emails: 0 })
    }

    // Skills de toutes les nouvelles offres
    const allJobSkillIds = new Set(newJobs.flatMap((j) => j.job_skills.map((s) => s.skill_id)))
    if (allJobSkillIds.size === 0) {
      return NextResponse.json({ ok: true, jobs: newJobs.length, emails: 0, reason: 'no skills on jobs' })
    }

    // Talents approuvés, visibles, avec alertes actives
    const { data: talents, error: talentsErr } = await supabase
      .from('talent_profiles')
      .select('id, user_id, first_name, last_alerted_at, talent_skills ( skill_id )')
      .eq('validation_status', 'approved')
      .eq('visibility', true)
      .eq('receive_alerts', true)
      .limit(100)
      .returns<TalentRow[]>()

    if (talentsErr) throw talentsErr
    if (!talents || talents.length === 0) {
      return NextResponse.json({ ok: true, jobs: newJobs.length, emails: 0, reason: 'no eligible talents' })
    }

    // Pour chaque talent, trouver les offres matchantes
    const resendEnabled = !!process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_[')
    let emailsSent = 0
    const nowIso = new Date().toISOString()

    for (const talent of talents) {
      const talentSkillIds = new Set(talent.talent_skills.map((s) => s.skill_id))

      const matchingJobs = newJobs.filter((job) => {
        // Ne pas ré-alerter si ce talent a déjà été alerté après la publication de cette offre
        if (talent.last_alerted_at && job.published_at && talent.last_alerted_at >= job.published_at) return false
        // Matcher par skills
        return job.job_skills.some((s) => talentSkillIds.has(s.skill_id))
      })

      if (matchingJobs.length === 0) continue

      // Récupérer l'email du talent
      const { data: authUser } = await supabase.auth.admin.getUserById(talent.user_id)
      if (!authUser.user?.email) continue

      const jobAlerts: JobAlert[] = matchingJobs.slice(0, 5).map((j) => ({
        title: j.title,
        slug: j.slug,
        company: j.company_profiles?.name ?? 'Entreprise APEBI',
        city: j.city,
        contract: j.contract_type,
      }))

      if (resendEnabled) {
        await resend.emails.send({
          from: `${FROM_NAME} <${FROM}>`,
          to: authUser.user.email,
          subject: `${jobAlerts.length} nouvelle${jobAlerts.length > 1 ? 's' : ''} offre${jobAlerts.length > 1 ? 's' : ''} pour vous sur APEBI TechTalent`,
          html: alertEmail(talent.first_name, jobAlerts, talent.id),
        })
      }

      // Notification in-app + màj last_alerted_at
      await Promise.all([
        supabase.from('notifications').insert({
          user_id: talent.user_id,
          type: 'job_alert',
          title: `${jobAlerts.length} nouvelle${jobAlerts.length > 1 ? 's' : ''} offre${jobAlerts.length > 1 ? 's' : ''} pour vous`,
          body: jobAlerts.map((j) => j.title).join(', '),
          link: '/offres',
        }),
        supabase.from('talent_profiles')
          .update({ last_alerted_at: nowIso })
          .eq('id', talent.id),
      ])

      emailsSent++
    }

    console.log(`[job-alerts] jobs=${newJobs.length} emails=${emailsSent}`)
    return NextResponse.json({ ok: true, jobs: newJobs.length, emails: emailsSent })
  } catch (err) {
    console.error('[job-alerts]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}
