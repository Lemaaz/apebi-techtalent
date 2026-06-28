import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/server'

const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = process.env.EMAIL_FROM      ?? 'noreply@techtalent-apebi.vercel.app'
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'APEBI TechTalent'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://techtalent-apebi.vercel.app'

function unsubUrl(profileId: string): string {
  const secret = process.env.CRON_SECRET ?? 'fallback'
  const token  = createHmac('sha256', secret).update(profileId).digest('hex').slice(0, 32)
  return `${APP_URL}/api/unsubscribe?id=${profileId}&token=${token}`
}

function esc(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

function digestEmail(
  firstName: string,
  views: number,
  newOffers: number,
  completeness: number,
  profileId: string,
): string {
  const hasInsight = views > 0 || newOffers > 0

  const viewsBlock = views > 0 ? `
    <div style="background:#f0fafd;border-radius:10px;padding:16px;text-align:center;margin-bottom:12px">
      <p style="font-size:32px;font-weight:700;color:#00AFD2;margin:0">${views}</p>
      <p style="font-size:13px;color:#545454;margin:4px 0 0">consultation${views > 1 ? 's' : ''} de votre profil cette semaine</p>
    </div>` : ''

  const offersBlock = newOffers > 0 ? `
    <div style="background:#f0fdf4;border-radius:10px;padding:16px;text-align:center;margin-bottom:12px">
      <p style="font-size:32px;font-weight:700;color:#10b981;margin:0">${newOffers}</p>
      <p style="font-size:13px;color:#545454;margin:4px 0 0">nouvelle${newOffers > 1 ? 's' : ''} offre${newOffers > 1 ? 's' : ''} correspondant à votre profil</p>
    </div>` : ''

  const completenessBlock = completeness < 70 ? `
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:14px;margin-bottom:16px">
      <p style="font-size:13px;color:#92400e;margin:0">
        <strong>Conseil :</strong> Votre profil est complété à <strong>${completeness}%</strong>.
        Un profil complet à 70% est visible par les recruteurs APEBI et augmente vos chances d'être contacté.
      </p>
      <a href="${APP_URL}/talent/profil/modifier" style="display:inline-block;margin-top:10px;background:#f59e0b;color:#fff;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none">
        Compléter mon profil →
      </a>
    </div>` : ''

  const noInsightMsg = !hasInsight ? `
    <p style="font-size:14px;color:#545454;margin:0 0 16px">
      Pas encore d'activité cette semaine — continuez à enrichir votre profil pour attirer l'attention des recruteurs.
    </p>` : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Votre semaine sur APEBI TechTalent</title></head>
<body style="font-family:Hind,system-ui,sans-serif;background:#f5f5f5;margin:0;padding:24px">
<div style="background:#fff;border-radius:12px;max-width:560px;margin:0 auto;padding:32px;border:1px solid #eaeaea">
  <div style="border-bottom:1px solid #eaeaea;padding-bottom:16px;margin-bottom:24px">
    <span style="font-size:15px;font-weight:700;color:#202020">APEBI <span style="color:#00AFD2">Tech</span>Talent</span>
  </div>

  <h1 style="font-size:20px;font-weight:700;color:#202020;margin:0 0 6px">
    Bonjour ${esc(firstName)} 👋
  </h1>
  <p style="font-size:14px;color:#545454;margin:0 0 20px">
    Voici votre résumé hebdomadaire sur APEBI TechTalent.
  </p>

  ${viewsBlock}
  ${offersBlock}
  ${noInsightMsg}
  ${completenessBlock}

  <div style="text-align:center;margin-top:8px">
    <a href="${APP_URL}/talent/profil"
       style="display:inline-block;background:#00AFD2;color:#fff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">
      Voir mon profil →
    </a>
  </div>

  ${newOffers > 0 ? `
  <div style="margin-top:20px;text-align:center">
    <a href="${APP_URL}/offres"
       style="display:inline-block;border:1px solid #00AFD2;color:#00AFD2;padding:10px 22px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none">
      Voir les offres →
    </a>
  </div>` : ''}

  <div style="margin-top:28px;padding-top:16px;border-top:1px solid #eaeaea;font-size:12px;color:#797979">
    <p style="margin:0">Digest hebdomadaire APEBI TechTalent · chaque dimanche</p>
    <p style="margin:6px 0 0"><a href="${unsubUrl(profileId)}" style="color:#00AFD2">Se désabonner des emails</a></p>
  </div>
</div>
</body></html>`
}

type TalentRow = {
  id: string
  user_id: string
  first_name: string
  completeness_score: number | null
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth   = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET missing' }, { status: 500 })
  if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createAdminClient()
    const since7d  = new Date(Date.now() - 7 * 86_400_000).toISOString()

    // Talents éligibles (approuvés + alertes actives)
    const { data: talents, error: talentsErr } = await supabase
      .from('talent_profiles')
      .select('id, user_id, first_name, completeness_score')
      .eq('validation_status', 'approved')
      .eq('receive_alerts', true)
      .limit(200)
      .returns<TalentRow[]>()

    if (talentsErr) throw talentsErr
    if (!talents || talents.length === 0) {
      return NextResponse.json({ ok: true, digests: 0, reason: 'no eligible talents' })
    }

    // Vues de profils cette semaine (profil_vu depuis funnel_events)
    const talentIds = talents.map(t => t.id)
    const { data: viewEvents } = await supabase
      .from('funnel_events')
      .select('talent_id')
      .eq('event_type', 'profil_vu')
      .gte('created_at', since7d)
      .in('talent_id', talentIds)

    const viewCountMap: Record<string, number> = {}
    for (const { talent_id } of viewEvents ?? []) {
      if (talent_id) viewCountMap[talent_id] = (viewCountMap[talent_id] ?? 0) + 1
    }

    // Skills actifs sur les nouvelles offres de la semaine — 1 requête GROUP au lieu de N
    // Récupère les skill_ids présents dans les offres actives publiées cette semaine
    const { data: newJobSkillRows } = await supabase
      .from('job_postings')
      .select('job_skills ( skill_id )')
      .eq('status', 'active')
      .gte('published_at', since7d)
      .limit(50)
    const newJobSkillSet = new Set<string>(
      (newJobSkillRows ?? []).flatMap((j: { job_skills: Array<{ skill_id: string }> }) =>
        j.job_skills.map(s => s.skill_id)
      )
    )

    // Tous les skills des talents éligibles — 1 requête au lieu de N
    const { data: allTalentSkillRows } = await supabase
      .from('talent_skills')
      .select('talent_id, skill_id')
      .in('talent_id', talentIds)
    const talentSkillsMap = new Map<string, string[]>()
    for (const { talent_id, skill_id } of allTalentSkillRows ?? []) {
      const arr = talentSkillsMap.get(talent_id) ?? []
      arr.push(skill_id)
      talentSkillsMap.set(talent_id, arr)
    }

    // Batch-fetch emails — 1 listUsers() au lieu de N getUserById()
    const { data: usersPage } = await supabase.auth.admin.listUsers({ perPage: 1000, page: 1 })
    const emailMap = new Map<string, string>()
    for (const u of usersPage?.users ?? []) {
      if (u.email) emailMap.set(u.id, u.email)
    }

    const resendEnabled = !!process.env.RESEND_API_KEY

    let digestsSent = 0

    for (const talent of talents) {
      const views = viewCountMap[talent.id] ?? 0
      const score = talent.completeness_score ?? 0

      // Matching en mémoire — 0 appel réseau supplémentaire
      const skillIds = talentSkillsMap.get(talent.id) ?? []
      const matchingNew = skillIds.filter(sid => newJobSkillSet.has(sid)).length

      // Ne pas envoyer si aucune info utile + profil complet
      if (views === 0 && matchingNew === 0 && score >= 70) continue

      const email = emailMap.get(talent.user_id)
      if (!email) continue

      if (resendEnabled) {
        await resend.emails.send({
          from: `${FROM_NAME} <${FROM}>`,
          to: email,
          subject: views > 0
            ? `Votre profil a été consulté ${views} fois cette semaine`
            : `Résumé de la semaine — APEBI TechTalent`,
          html: digestEmail(talent.first_name, views, matchingNew, score, talent.id),
        })
      }

      digestsSent++
    }

    console.log(`[profile-digest] digests=${digestsSent}/${talents.length}`)
    return NextResponse.json({ ok: true, digests: digestsSent, total: talents.length })
  } catch (err) {
    console.error('[profile-digest]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}
