import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, ArrowRight, CheckCircle, Users, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { HowItWorksTabs } from '@/components/landing/how-it-works-tabs'
import { NetworkGraph } from '@/components/landing/network-graph'
import { TrustMarquee } from '@/components/landing/trust-marquee'

export const metadata: Metadata = {
  title: { absolute: 'APEBI TechTalent — Talents tech & entreprises numériques au Maroc' },
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
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden bg-[var(--apebi-dark-90)]"
        >
          {/* Couches de fond — texture réseau + lueurs */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div
              className="aurora absolute -left-40 -top-32 size-[460px] rounded-full blur-[110px]"
              style={{ background: 'radial-gradient(circle, rgba(0,175,210,0.16), transparent 55%)' }}
            />
            <div
              className="aurora aurora-slow absolute -right-32 top-16 size-[500px] rounded-full blur-[120px]"
              style={{ background: 'radial-gradient(circle, rgba(58,70,82,0.4), transparent 55%)' }}
            />
          </div>

          <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-32">

            {/* Left — text + CTAs */}
            <div className="flex flex-col justify-center">
              <span
                className="rise-in mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--apebi-cyan)]/30 bg-white/[0.06] px-3 py-1 text-xs font-medium text-[var(--apebi-cyan)]"
                style={{ animationDelay: '0ms' }}
              >
                <span className="node-pulse size-1.5 rounded-full bg-[var(--apebi-cyan)]" aria-hidden />
                Plateforme officielle APEBI
              </span>

              <h1
                id="hero-heading"
                className="rise-in font-heading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[52px] lg:leading-[1.1]"
                style={{ animationDelay: '80ms' }}
              >
                Connectez les talents tech aux entreprises qui construisent le{' '}
                <span className="text-gradient-cyan">Maroc numérique</span>
              </h1>

              <p
                className="rise-in mt-5 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg"
                style={{ animationDelay: '160ms' }}
              >
                La plateforme officielle de l&apos;APEBI pour mettre en relation les entreprises
                membres et les profils tech marocains qualifiés.
              </p>

              <div className="rise-in mt-8 flex flex-wrap gap-3" style={{ animationDelay: '240ms' }}>
                <Link
                  href="/entreprises/inscription"
                  className="btn-shine inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--apebi-cyan)] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[var(--apebi-cyan-dark)]"
                >
                  <Briefcase className="size-4" aria-hidden />
                  Je cherche un talent
                </Link>
                <Link
                  href="/offres"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:border-[var(--apebi-cyan)] hover:bg-white/[0.1]"
                >
                  <Users className="size-4" aria-hidden />
                  Je cherche une opportunité
                </Link>
              </div>

              {/* Social proof */}
              <div className="rise-in mt-8 flex items-center gap-3" style={{ animationDelay: '320ms' }}>
                <div className="flex -space-x-2" aria-hidden>
                  {(avatarInitials.length > 0 ? avatarInitials : ['CI', 'DX', 'TS', 'AI']).map((init) => (
                    <div
                      key={init}
                      className="flex size-7 items-center justify-center rounded-full border-2 border-[var(--apebi-dark-90)] bg-[var(--apebi-navy)] text-[9px] font-bold text-white"
                    >
                      {init}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/50">
                  <span className="font-semibold text-white">
                    {displayCount(companyCount, STAT_FLOORS.companies)} entreprises
                  </span>{' '}
                  membres de l&apos;écosystème APEBI
                </p>
              </div>
            </div>

            {/* Right — network graph */}
            <div className="rise-in hidden items-center justify-center lg:flex" style={{ animationDelay: '200ms' }}>
              <NetworkGraph />
            </div>
          </div>
        </section>

        {/* ── Trust marquee ─────────────────────────────────────── */}
        <TrustMarquee />

        {/* ── Stats bar ─────────────────────────────────────────── */}
        <section aria-label="Chiffres clés" className="border-t border-[var(--apebi-border)] bg-[var(--apebi-bg-alt)]">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-[var(--apebi-border)] sm:grid-cols-4">
            {liveStats.map(({ value, label }) => (
              <div
                key={label}
                className="group flex flex-col items-center justify-center px-6 py-8 text-center transition-colors hover:bg-white"
              >
                <dt className="font-heading text-3xl font-bold text-[var(--apebi-cyan-dark)] transition-transform duration-300 group-hover:scale-110">{value}</dt>
                <dd className="mt-1 text-xs text-[var(--apebi-text-muted)]">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Comment ça marche ─────────────────────────────────── */}
        <section
          aria-labelledby="how-heading"
          className="relative overflow-hidden bg-white px-4 py-20 sm:px-6"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-cyan mask-radial opacity-25" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-3 flex justify-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--apebi-coral)]">
                Simple &amp; efficace
              </span>
            </div>
            <h2
              id="how-heading"
              className="mb-3 text-center font-heading text-3xl font-bold text-[var(--apebi-text)] sm:text-4xl"
            >
              Comment ça marche
            </h2>
            <p className="mb-10 text-center text-sm text-[var(--apebi-text-muted)]">
              Choisissez votre parcours et démarrez en quelques minutes.
            </p>
            <HowItWorksTabs />
          </div>
        </section>

        {/* ── Entreprises en vedette ────────────────────────────── */}
        <section
          aria-labelledby="companies-heading"
          className="border-t border-[var(--apebi-border)] bg-[var(--apebi-bg-alt)] px-4 py-20 sm:px-6"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <h2
                id="companies-heading"
                className="font-heading text-3xl font-bold text-[var(--apebi-text)] sm:text-4xl"
              >
                Entreprises membres en vedette
              </h2>
              <Link
                href="/entreprises"
                className="flex items-center gap-1 text-xs font-medium text-[#0E6E85] hover:underline"
              >
                Voir toutes
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </div>

            {featuredCompanies.length === 0 ? (
              <p className="text-center text-sm text-[var(--apebi-text-light)] py-8">
                Les entreprises validées apparaîtront ici.
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
                {featuredCompanies.map((company) => (
                  <li key={company.id}>
                    <Link href={`/entreprises/${company.slug}`} className="block">
                      <div className="group card-lift rounded-xl border border-[var(--apebi-border)] bg-white p-5 shadow-[var(--shadow-card)] hover:border-[var(--apebi-cyan)] hover:shadow-[var(--shadow-card-hover)]">
                        <div className="mb-4 flex items-center gap-3">
                          {company.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={company.logo_url}
                              alt=""
                              className="size-10 shrink-0 rounded-lg object-contain bg-[var(--apebi-bg-alt)]"
                            />
                          ) : (
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--apebi-navy)] font-heading text-sm font-semibold text-white">
                              {companyInitials(company.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-heading text-sm font-semibold text-[var(--apebi-text)]">
                              {company.name}
                            </p>
                            <span className="badge-domain mt-1">{company.sector}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-[var(--apebi-text-light)]">
                            <MapPin className="size-3" aria-hidden />
                            {company.city ?? 'Maroc'}
                          </span>
                          <span className="text-xs font-medium text-[#0E6E85]">
                            {company.activeJobs} offre{company.activeJobs !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-1.5">
                          <CheckCircle className="size-3 text-[var(--apebi-cyan)]" aria-hidden />
                          <span className="text-xs text-[var(--apebi-text-light)]">Membre APEBI validé</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── Légitimité institutionnelle ──────────────────────── */}
        <section
          id="institution"
          aria-labelledby="institution-heading"
          className="relative overflow-hidden bg-[var(--apebi-dark-90)] px-4 py-24 sm:px-6"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-32 size-[360px] rounded-full blur-[110px]"
            style={{ background: 'radial-gradient(circle, rgba(0,175,210,0.14), transparent 70%)' }}
          />
          <div className="relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--apebi-cyan)]">
                Légitimité institutionnelle
              </span>
              <h2
                id="institution-heading"
                className="mt-3 font-heading text-3xl font-bold leading-tight text-white sm:text-4xl"
              >
                Portée par l&apos;APEBI, la fédération officielle du numérique marocain
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/60 sm:text-base">
                APEBI TechTalent est l&apos;outil digital de l&apos;axe « Tech Talent Bridge » porté
                par la Commission sectorielle Formation &amp; Talent tech (C5) de l&apos;APEBI —
                l&apos;interlocuteur institutionnel des pouvoirs publics sur les politiques
                numériques.
              </p>
              <dl className="mt-8 flex flex-wrap gap-8">
                {[
                  { value: '300+', label: 'entreprises membres APEBI' },
                  { value: 'C5', label: 'Commission Formation & Talent tech' },
                  { value: '48h', label: 'délai de validation des comptes' },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <dt className="font-heading text-2xl font-bold text-white">{value}</dt>
                    <dd className="mt-1 text-xs text-white/45">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-col gap-3">
              {[
                'Fédération officielle du numérique marocain',
                '300+ entreprises membres APEBI',
                'Label APEBI TechTalent',
                'Axe C — Tech Talent Bridge',
              ].map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--apebi-cyan)]/10">
                    <span className="size-2 rotate-45 rounded-[2px] bg-[var(--apebi-cyan)]" aria-hidden />
                  </div>
                  <span className="font-heading text-sm font-medium text-white">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ────────────────────────────────────────── */}
        <section
          aria-labelledby="cta-heading"
          className="relative overflow-hidden bg-gradient-to-br from-[var(--apebi-dark-90)] to-[#16232A] px-4 py-24 text-center sm:px-6"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0,175,210,0.16), transparent 60%)' }}
          />

          <div className="relative mx-auto max-w-2xl">
            <h2
              id="cta-heading"
              className="font-heading text-3xl font-bold text-white sm:text-4xl"
            >
              Prêt à rejoindre l&apos;écosystème ?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              {displayCount(companyCount, STAT_FLOORS.companies)} entreprises membres et{' '}
              {displayCount(talentCount, STAT_FLOORS.talents)} talents vous attendent sur la
              plateforme officielle de l&apos;APEBI.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/entreprises/inscription"
                className="btn-shine inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--apebi-cyan)] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[var(--apebi-cyan-dark)]"
              >
                <Briefcase className="size-4" aria-hidden />
                Inscrire mon entreprise
              </Link>
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:border-[var(--apebi-cyan)] hover:bg-white/[0.1]"
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
