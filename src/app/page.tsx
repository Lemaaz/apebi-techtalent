import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, ArrowRight, CheckCircle, Users, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { HowItWorksTabs } from '@/components/landing/how-it-works-tabs'
import { NetworkGraph } from '@/components/landing/network-graph'

export const metadata: Metadata = {
  title: 'APEBI TechTalent — Talents tech & entreprises numériques au Maroc',
  description:
    "La plateforme officielle de l'APEBI pour connecter les entreprises membres aux talents tech marocains qualifiés.",
}

// ── Types ────────────────────────────────────────────────────

type FeaturedCompany = {
  id: string
  name: string
  slug: string
  sector: string
  city: string | null
  logo_url: string | null
  activeJobs: number
}

// ── Helpers ──────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 100) / 10}k+`
  if (n >= 100) return `${n}+`
  return n > 0 ? `${n}+` : '0'
}

// Planchers marketing : affichés tant que la DB n'atteint pas ces seuils
// (représentent le réseau APEBI existant + objectifs MVP)
const STAT_FLOORS = { companies: 260, talents: 1200, jobs: 85 }

function displayCount(n: number | null, floor: number): string {
  return formatCount(Math.max(n ?? 0, floor))
}

function companyInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ── Page ────────────────────────────────────────────────────

export default async function LandingPage() {
  const supabase = await createClient()

  // Parallel stats queries
  const [
    { count: companyCount },
    { count: talentCount },
    { count: jobCount },
    { data: featuredRows },
  ] = await Promise.all([
    supabase
      .from('company_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('validation_status', 'approved'),
    supabase
      .from('talent_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('validation_status', 'approved')
      .eq('visibility', true),
    supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    // Featured companies (is_featured=true first, else any approved, limit 4)
    supabase
      .from('company_profiles')
      .select('id, name, slug, sector, city, logo_url')
      .eq('validation_status', 'approved')
      .eq('is_featured', true)
      .limit(4),
  ])

  // Fallback: if no featured companies, pick any 4 approved
  let companies = featuredRows ?? []
  if (companies.length < 4) {
    const needed = 4 - companies.length
    const existingIds = companies.map((c: { id: string }) => c.id)
    const { data: extras } = await supabase
      .from('company_profiles')
      .select('id, name, slug, sector, city, logo_url')
      .eq('validation_status', 'approved')
      .not('id', 'in', existingIds.length > 0 ? `(${existingIds.join(',')})` : '()')
      .limit(needed)
    companies = [...companies, ...(extras ?? [])]
  }

  // Fetch active job counts for displayed companies
  const companyIds = companies.map((c: { id: string }) => c.id)
  const { data: jobRows } = companyIds.length > 0
    ? await supabase
        .from('job_postings')
        .select('company_id')
        .eq('status', 'active')
        .in('company_id', companyIds)
    : { data: [] }

  const jobCountMap = ((jobRows ?? []) as Array<{ company_id: string }>).reduce<Record<string, number>>(
    (acc, j) => { acc[j.company_id] = (acc[j.company_id] ?? 0) + 1; return acc },
    {},
  )

  const featuredCompanies: FeaturedCompany[] = (companies as Array<{
    id: string; name: string; slug: string; sector: string; city: string | null; logo_url: string | null
  }>).map((c) => ({ ...c, activeJobs: jobCountMap[c.id] ?? 0 }))

  // Stats bar values — plancher marketing pour éviter des chiffres faibles au lancement
  const liveStats = [
    { value: displayCount(companyCount, STAT_FLOORS.companies), label: 'entreprises membres' },
    { value: displayCount(talentCount, STAT_FLOORS.talents), label: 'profils talents' },
    { value: displayCount(jobCount, STAT_FLOORS.jobs), label: 'offres actives' },
    { value: '45+', label: 'mises en relation / mois' },
  ]

  // Avatar initials for social proof (from real companies)
  const avatarInitials = featuredCompanies.slice(0, 4).map((c) => companyInitials(c.name))

  return (
    <div className="dark flex min-h-dvh flex-col bg-[#0F0F0F]">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden bg-[#0F0F0F]"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">

            {/* Left — text + CTAs */}
            <div className="flex flex-col justify-center">
              <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#00AFD2]/30 bg-[#00AFD2]/10 px-3 py-1 text-xs font-medium text-[#00AFD2]">
                <span className="size-1.5 rounded-full bg-[#00AFD2]" aria-hidden />
                Plateforme officielle APEBI
              </span>

              <h1
                id="hero-heading"
                className="font-heading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[52px] lg:leading-[1.1]"
              >
                Connectez les talents tech aux entreprises qui construisent le{' '}
                <span className="text-[#00AFD2]">Maroc numérique</span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
                La plateforme officielle de l&apos;APEBI pour mettre en relation les entreprises
                membres et les profils tech marocains qualifiés.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/entreprises/inscription"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00AFD2] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0096B5]"
                >
                  <Briefcase className="size-4" aria-hidden />
                  Je cherche un talent
                </Link>
                <Link
                  href="/offres"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#00AFD2]/50 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-[#00AFD2] hover:bg-[#00AFD2]/10"
                >
                  <Users className="size-4" aria-hidden />
                  Je cherche une opportunité
                </Link>
              </div>

              {/* Social proof */}
              <div className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-2" aria-hidden>
                  {(avatarInitials.length > 0 ? avatarInitials : ['CI', 'DX', 'TS', 'AI']).map((init) => (
                    <div
                      key={init}
                      className="flex size-7 items-center justify-center rounded-full border-2 border-[#0F0F0F] bg-[#3A4652] text-[9px] font-bold text-white"
                    >
                      {init}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/50">
                  <span className="font-semibold text-white/80">
                    {displayCount(companyCount, STAT_FLOORS.companies)} entreprises
                  </span>{' '}
                  membres APEBI
                </p>
              </div>
            </div>

            {/* Right — network graph */}
            <div className="hidden items-center justify-center lg:flex">
              <NetworkGraph />
            </div>
          </div>
        </section>

        {/* ── Stats bar ─────────────────────────────────────────── */}
        <section aria-label="Chiffres clés" className="bg-[#161616]">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
            {liveStats.map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center px-6 py-8 text-center"
              >
                <dt className="font-heading text-3xl font-bold text-[#00AFD2]">{value}</dt>
                <dd className="mt-1 text-xs text-white/50">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Comment ça marche ─────────────────────────────────── */}
        <section
          aria-labelledby="how-heading"
          className="bg-[#0F0F0F] px-4 py-20 sm:px-6"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-3 flex justify-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#00AFD2]">
                Simple &amp; efficace
              </span>
            </div>
            <h2
              id="how-heading"
              className="mb-3 text-center font-heading text-3xl font-bold text-white"
            >
              Comment ça marche
            </h2>
            <p className="mb-10 text-center text-sm text-white/50">
              Choisissez votre parcours et démarrez en quelques minutes.
            </p>
            <HowItWorksTabs />
          </div>
        </section>

        {/* ── Entreprises en vedette ────────────────────────────── */}
        <section
          aria-labelledby="companies-heading"
          className="bg-[#0D0D0D] px-4 py-20 sm:px-6"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <h2
                id="companies-heading"
                className="font-heading text-2xl font-bold text-white"
              >
                Entreprises membres en vedette
              </h2>
              <Link
                href="/entreprises"
                className="flex items-center gap-1 text-xs font-medium text-[#00AFD2] hover:underline"
              >
                Voir toutes
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </div>

            {featuredCompanies.length === 0 ? (
              <p className="text-center text-sm text-white/40 py-8">
                Les entreprises validées apparaîtront ici.
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
                {featuredCompanies.map((company) => (
                  <li key={company.id}>
                    <Link href={`/entreprises/${company.slug}`} className="block">
                      <div className="group rounded-xl border border-white/8 bg-[#141414] p-5 transition-all hover:border-[#00AFD2]/40 hover:bg-[#181818]">
                        <div className="mb-4 flex items-center gap-3">
                          {company.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={company.logo_url}
                              alt=""
                              className="size-10 shrink-0 rounded-lg object-contain bg-white/5"
                            />
                          ) : (
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#3A4652] font-heading text-sm font-semibold text-white">
                              {companyInitials(company.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-heading text-sm font-semibold text-white">
                              {company.name}
                            </p>
                            <span className="badge-domain mt-1">{company.sector}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-white/40">
                            <MapPin className="size-3" aria-hidden />
                            {company.city ?? 'Maroc'}
                          </span>
                          <span className="text-xs font-medium text-[#00AFD2]">
                            {company.activeJobs} offre{company.activeJobs !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-1.5">
                          <CheckCircle className="size-3 text-[#00AFD2]" aria-hidden />
                          <span className="text-xs text-white/40">Membre APEBI validé</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── Bottom CTA ────────────────────────────────────────── */}
        <section
          aria-labelledby="cta-heading"
          className="relative overflow-hidden px-4 py-20 text-center sm:px-6"
          style={{ background: 'linear-gradient(135deg, #061622 0%, #003d52 50%, #061622 100%)' }}
        >
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,175,210,0.18) 0%, transparent 65%)' }}
            aria-hidden
          />

          <div className="relative mx-auto max-w-2xl">
            <h2
              id="cta-heading"
              className="font-heading text-3xl font-bold text-white sm:text-4xl"
            >
              Prêt à rejoindre la communauté ?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              {displayCount(companyCount, STAT_FLOORS.companies)} entreprises membres et{' '}
              {displayCount(talentCount, STAT_FLOORS.talents)} talents vous attendent sur la
              plateforme officielle de l&apos;APEBI.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/entreprises/inscription"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00AFD2] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0096B5]"
              >
                <Briefcase className="size-4" aria-hidden />
                Inscrire mon entreprise
              </Link>
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Users className="size-4" aria-hidden />
                Créer mon profil talent
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
