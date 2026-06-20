import type { Metadata } from 'next'
import { BarChart3, TrendingUp, Users, MapPin, Scale, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { EmptyState } from '@/components/ui/empty-state'
import { StatBar } from '@/components/observatoire/stat-bar'

// Observatoire des Compétences (T7) — levier de plaidoyer APEBI.
// Lit les 4 vues matérialisées (008). Simple SELECT, pas d'agrégation
// à la volée → ISR 1h. Données publiques agrégées (aucune PII).
//
// ⚠️ Requiert l'application des migrations 004-008 + `supabase gen types`
//    pour que les vues mv_* soient typées et lisibles.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Observatoire des Compétences Tech | APEBI TechTalent',
  description:
    "Données du marché des compétences tech marocaines : compétences demandées, vivier de talents, répartition par domaine et géographie. Par la Commission Formation & Talent Tech de l'APEBI.",
}

type SkillDemandRow = { name: string; domain_code: string | null; demand_count: number }
type SkillSupplyRow = { name: string; domain_code: string | null; supply_count: number }
type GeoRow = { city: string; talent_count: number }
type DomainRow = {
  code: string
  name_fr: string
  active_jobs: number
  approved_talents: number
}

async function fetchObservatoire() {
  const supabase = await createClient()

  const [demand, supply, geo, domains, activeJobs] = await Promise.all([
    supabase
      .from('mv_skills_demand')
      .select('name, domain_code, demand_count')
      .order('demand_count', { ascending: false })
      .limit(10)
      .returns<SkillDemandRow[]>(),
    supabase
      .from('mv_skills_supply')
      .select('name, domain_code, supply_count')
      .order('supply_count', { ascending: false })
      .limit(10)
      .returns<SkillSupplyRow[]>(),
    supabase
      .from('mv_geo_distribution')
      .select('city, talent_count')
      .order('talent_count', { ascending: false })
      .limit(12)
      .returns<GeoRow[]>(),
    supabase
      .from('mv_domain_activity')
      .select('code, name_fr, active_jobs, approved_talents')
      .order('code', { ascending: true })
      .returns<DomainRow[]>(),
    // Comptage direct des offres actives (indépendant du domain_id) —
    // lisible par anon via la policy public_read_active_jobs.
    supabase
      .from('job_postings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  if (demand.error || supply.error || geo.error || domains.error) {
    console.error(
      '[observatoire] Supabase error:',
      demand.error?.message ?? supply.error?.message ?? geo.error?.message ?? domains.error?.message,
    )
  }

  return {
    demand: demand.data ?? [],
    supply: supply.data ?? [],
    geo: geo.data ?? [],
    domains: domains.data ?? [],
    activeJobsCount: activeJobs.count ?? 0,
  }
}

export default async function ObservatoirePage() {
  const { demand, supply, geo, domains, activeJobsCount } = await fetchObservatoire()

  const hasData =
    demand.length > 0 || supply.length > 0 || geo.length > 0 || domains.some((d) => d.active_jobs > 0 || d.approved_talents > 0)

  const maxDemand = Math.max(1, ...demand.map((d) => d.demand_count))
  const maxSupply = Math.max(1, ...supply.map((s) => s.supply_count))
  const maxGeo = Math.max(1, ...geo.map((g) => g.talent_count))

  // Indicateurs globaux
  // Offres actives : comptage direct (indépendant du domain_id sur les offres).
  const totalActiveJobs = activeJobsCount
  // Talents : somme des talents validés répartis par ville (proxy lisible par anon).
  const totalTalents = geo.reduce((acc, g) => acc + g.talent_count, 0)

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero institutionnel ───────────────────── */}
        <section className="border-b border-white/8 px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-[#00AFD2]/10 px-3 py-1 text-xs font-medium text-[#00AFD2]">
              <BarChart3 className="size-3.5" aria-hidden />
              Observatoire des Talents · Commission Formation & Tech Talents
            </p>
            <h1 className="mt-4 font-heading text-3xl font-bold text-white sm:text-4xl">
              Observatoire des Compétences Tech
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
              Une lecture en temps réel du marché des compétences numériques marocaines,
              alimentée par l&apos;écosystème APEBI : ce que les entreprises recherchent, le
              vivier de talents disponible, et les déséquilibres par domaine. Un outil au
              service du plaidoyer de la fédération.
            </p>

            {/* KPIs */}
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-xl border border-white/8 bg-[#141414] px-4 py-3">
                <p className="font-heading text-2xl font-bold text-white">{totalActiveJobs}</p>
                <p className="text-xs text-white/45">Offres actives</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-[#141414] px-4 py-3">
                <p className="font-heading text-2xl font-bold text-white">{totalTalents}</p>
                <p className="text-xs text-white/45">Talents référencés</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-[#141414] px-4 py-3">
                <p className="font-heading text-2xl font-bold text-white">{domains.length}</p>
                <p className="text-xs text-white/45">Domaines tech</p>
              </div>
            </div>
          </div>
        </section>

        {!hasData ? (
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <EmptyState
              icon={BarChart3}
              title="Données insuffisantes pour le moment"
              description="L'Observatoire se construit à mesure que les talents et les entreprises rejoignent la plateforme. Les premières tendances apparaîtront dès les premières inscriptions validées."
            />
          </div>
        ) : (
          <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6">
            {/* ── Compétences demandées ──────────────── */}
            <section aria-labelledby="demand-h">
              <h2 id="demand-h" className="mb-1 flex items-center gap-2 font-heading text-lg font-semibold text-white">
                <TrendingUp className="size-4 text-[#00AFD2]" aria-hidden />
                Compétences les plus demandées
              </h2>
              <p className="mb-5 text-xs text-white/45">Par les offres d&apos;emploi actives.</p>
              {demand.length > 0 ? (
                <div className="space-y-2.5">
                  {demand.map((d) => (
                    <StatBar
                      key={d.name}
                      label={d.name}
                      value={d.demand_count}
                      max={maxDemand}
                      hint={d.domain_code ?? undefined}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/40">Aucune offre active pour le moment.</p>
              )}
            </section>

            {/* ── Compétences déclarées ──────────────── */}
            <section aria-labelledby="supply-h">
              <h2 id="supply-h" className="mb-1 flex items-center gap-2 font-heading text-lg font-semibold text-white">
                <Users className="size-4 text-emerald-400" aria-hidden />
                Compétences les plus représentées
              </h2>
              <p className="mb-5 text-xs text-white/45">Dans le vivier de talents validés.</p>
              {supply.length > 0 ? (
                <div className="space-y-2.5">
                  {supply.map((s) => (
                    <StatBar
                      key={s.name}
                      label={s.name}
                      value={s.supply_count}
                      max={maxSupply}
                      hint={s.domain_code ?? undefined}
                      barClass="bg-emerald-400"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/40">Aucun talent validé pour le moment.</p>
              )}
            </section>

            {/* ── Activité par domaine (offre vs vivier) ── */}
            <section aria-labelledby="domain-h">
              <h2 id="domain-h" className="mb-1 flex items-center gap-2 font-heading text-lg font-semibold text-white">
                <Scale className="size-4 text-[#00AFD2]" aria-hidden />
                Équilibre offre / vivier par domaine
              </h2>
              <p className="mb-5 text-xs text-white/45">
                Les 6 domaines de compétences tech — tension entre offres actives et talents disponibles.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {domains.map((d) => {
                  const tension = d.approved_talents === 0
                    ? d.active_jobs > 0 ? 'Sous tension' : '—'
                    : `${(d.active_jobs / d.approved_talents).toFixed(1)} offre/talent`
                  return (
                    <div key={d.code} className="rounded-xl border border-white/8 bg-[#141414] p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-semibold text-[#00AFD2]">{d.code}</p>
                          <p className="text-sm font-medium text-white">{d.name_fr}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/55">
                          {tension}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-4 text-xs">
                        <span className="text-white/55">
                          <span className="font-heading text-base font-bold text-white">{d.active_jobs}</span> offres
                        </span>
                        <span className="text-white/55">
                          <span className="font-heading text-base font-bold text-white">{d.approved_talents}</span> talents
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* ── Répartition géographique ───────────── */}
            {geo.length > 0 && (
              <section aria-labelledby="geo-h">
                <h2 id="geo-h" className="mb-1 flex items-center gap-2 font-heading text-lg font-semibold text-white">
                  <MapPin className="size-4 text-[#00AFD2]" aria-hidden />
                  Répartition géographique des talents
                </h2>
                <p className="mb-5 text-xs text-white/45">Villes les plus représentées dans le vivier.</p>
                <div className="space-y-2.5">
                  {geo.map((g) => (
                    <StatBar key={g.city} label={g.city} value={g.talent_count} max={maxGeo} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Disclaimer représentativité ────────── */}
            <div className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <Info className="size-4 shrink-0 text-white/40" aria-hidden />
              <p className="text-xs leading-relaxed text-white/45">
                Ces données reflètent la population de la plateforme APEBI TechTalent (entreprises
                membres et talents inscrits validés), et non l&apos;ensemble du marché tech marocain.
                Elles donnent une tendance, non une mesure statistique exhaustive. La représentativité
                s&apos;améliore à mesure que l&apos;écosystème grandit. Données mises à jour toutes les heures.
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
