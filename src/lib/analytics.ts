import { createAdminClient } from '@/lib/supabase/server'

// Agrégation growth pour /admin/analytics. Volume MVP faible → agrégation JS
// sur des lignes plafonnées. À migrer en RPC SQL si le volume dépasse ~10k lignes.

export type WeekBucket = { label: string; talents: number; companies: number }

export type GrowthMetrics = {
  overview: {
    talentsTotal: number
    talentsApproved: number
    companiesTotal: number
    companiesApproved: number
    activeJobs: number
    misesEnRelation: number
  }
  acquisition: {
    weeks: WeekBucket[]
    referralCount: number
    referralPct: number
  }
  activationTalent: { inscrits: number; complets: number; candidats: number; vus: number }
  activationCompany: { inscrites: number; avecOffre: number; avecCandidature: number; avecMatch: number }
  engagement: {
    connexions7d: number
    connexions30d: number
    actifs7d: number
    actifs30d: number
  }
}

function iso(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86_400_000).toISOString()
}

export async function getGrowthMetrics(): Promise<GrowthMetrics> {
  const admin = createAdminClient()
  const since30d = iso(30)
  const since7d = iso(7)

  const [
    { data: talents },
    { data: companies },
    { data: jobs },
    { data: apps },
    { data: events },
    { count: referralCount },
  ] = await Promise.all([
    admin.from('talent_profiles').select('id, created_at, completeness_score, validation_status').limit(5000),
    admin.from('company_profiles').select('id, created_at, validation_status').limit(5000),
    admin.from('job_postings').select('id, company_id, status').limit(5000),
    admin.from('applications').select('talent_id, job_id').limit(5000),
    admin.from('funnel_events').select('event_type, user_id, talent_id, company_id, created_at').gte('created_at', since30d).limit(10000),
    admin.from('referrals').select('*', { count: 'exact', head: true }),
  ])

  const talentsRows = talents ?? []
  const companiesRows = companies ?? []
  const jobsRows = jobs ?? []
  const appsRows = apps ?? []
  const eventsRows = events ?? []

  // ── Overview ──
  const talentsApproved = talentsRows.filter((t) => t.validation_status === 'approved').length
  const companiesApproved = companiesRows.filter((c) => c.validation_status === 'approved').length
  const activeJobs = jobsRows.filter((j) => j.status === 'active').length

  // mise_en_relation cumulée (tous temps) via RPC groupé
  const { data: funnelCounts } = await admin.rpc('funnel_event_counts').returns<Array<{ event_type: string; cnt: number }>>()
  const misesEnRelation = (funnelCounts ?? []).find((f) => f.event_type === 'mise_en_relation')?.cnt ?? 0

  // ── Acquisition : 8 semaines glissantes ──
  const weeks: WeekBucket[] = Array.from({ length: 8 }, (_, i) => {
    const idx = 7 - i // 0 = plus ancienne, 7 = cette semaine
    return { label: idx === 0 ? 'Cette sem.' : `S-${idx}`, talents: 0, companies: 0 }
  })
  const now = Date.now()
  function bucketIndex(dateStr: string | null): number {
    if (!dateStr) return -1
    const weeksAgo = Math.floor((now - new Date(dateStr).getTime()) / (7 * 86_400_000))
    if (weeksAgo < 0 || weeksAgo > 7) return -1
    return 7 - weeksAgo
  }
  for (const t of talentsRows) {
    const b = bucketIndex(t.created_at)
    if (b >= 0) weeks[b].talents++
  }
  for (const c of companiesRows) {
    const b = bucketIndex(c.created_at)
    if (b >= 0) weeks[b].companies++
  }

  const totalSignups = talentsRows.length + companiesRows.length
  const refCount = referralCount ?? 0
  const referralPct = totalSignups > 0 ? Math.round((refCount / totalSignups) * 100) : 0

  // ── Activation talent ──
  const talentIdsWhoApplied = new Set(appsRows.map((a) => a.talent_id))
  const talentIdsViewed = new Set(eventsRows.filter((e) => e.event_type === 'profil_vu').map((e) => e.talent_id).filter(Boolean))
  const activationTalent = {
    inscrits: talentsRows.length,
    complets: talentsRows.filter((t) => (t.completeness_score ?? 0) >= 70).length,
    candidats: talentIdsWhoApplied.size,
    vus: talentIdsViewed.size,
  }

  // ── Activation entreprise ──
  const jobById = new Map(jobsRows.map((j) => [j.id, j.company_id]))
  const companiesWithJob = new Set(jobsRows.map((j) => j.company_id))
  const companiesReceivedApp = new Set(
    appsRows.map((a) => jobById.get(a.job_id)).filter(Boolean) as string[],
  )
  const companiesMatched = new Set(
    eventsRows.filter((e) => e.event_type === 'mise_en_relation').map((e) => e.company_id).filter(Boolean),
  )
  const activationCompany = {
    inscrites: companiesRows.length,
    avecOffre: companiesWithJob.size,
    avecCandidature: companiesReceivedApp.size,
    avecMatch: companiesMatched.size,
  }

  // ── Engagement / rétention (proxy activité tracée) ──
  const events7d = eventsRows.filter((e) => e.created_at >= since7d)
  const connexions7d = events7d.filter((e) => e.event_type === 'connexion').length
  const connexions30d = eventsRows.filter((e) => e.event_type === 'connexion').length
  const actifs7d = new Set(events7d.map((e) => e.user_id).filter(Boolean)).size
  const actifs30d = new Set(eventsRows.map((e) => e.user_id).filter(Boolean)).size

  return {
    overview: {
      talentsTotal: talentsRows.length,
      talentsApproved,
      companiesTotal: companiesRows.length,
      companiesApproved,
      activeJobs,
      misesEnRelation,
    },
    acquisition: { weeks, referralCount: refCount, referralPct },
    activationTalent,
    activationCompany,
    engagement: { connexions7d, connexions30d, actifs7d, actifs30d },
  }
}
