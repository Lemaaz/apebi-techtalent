import type { Metadata } from 'next'
import { Suspense } from 'react'
import { GraduationCap, Building2, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { FormationFilters } from '@/components/formation/formation-filters'
import { ProgramCard, type ProgramCardData } from '@/components/formation/program-card'
import { EmptyState } from '@/components/ui/empty-state'

export const metadata: Metadata = {
  title: 'Formation Hub',
  description:
    'Découvrez les formations tech de l\'écosystème APEBI : écoles, bootcamps, certifications. Parcours par domaine C5.',
}

type SearchParams = Promise<{
  q?: string
  domain?: string
  modality?: string
  level?: string
}>

type ProgramRow = {
  id: string
  slug: string
  title: string
  description: string | null
  level: string | null
  modality: string | null
  duration_text: string | null
  price_range: string | null
  is_featured: boolean
  url_inscription: string | null
  training_institutions: {
    name: string
    city: string | null
    logo_url: string | null
  } | null
  domains: {
    name_fr: string
    code: string
    color: string | null
  } | null
}

type InstitutionRow = {
  id: string
  name: string
  slug: string
  type: string
  description: string | null
  logo_url: string | null
  website_url: string | null
  city: string | null
  is_apebi_partner: boolean
}

type DomainRow = {
  id: string
  code: string
  name_fr: string
  color: string | null
  icon: string | null
  description_fr: string | null
}

async function fetchData(params: {
  q?: string
  domain?: string
  modality?: string
  level?: string
}) {
  const supabase = await createClient()

  const [programsResult, institutionsResult, domainsResult] = await Promise.all([
    (() => {
      let q = supabase
        .from('training_programs')
        .select(
          `id, slug, title, description, level, modality,
           duration_text, price_range, is_featured, url_inscription,
           training_institutions ( name, city, logo_url ),
           domains ( name_fr, code, color )`,
        )
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (params.q) q = q.ilike('title', `%${params.q}%`)
      if (params.domain)
        q = q.eq('domains.code', params.domain)
      if (params.modality) q = q.eq('modality', params.modality)
      if (params.level) q = q.eq('level', params.level)

      return q.returns<ProgramRow[]>()
    })(),
    supabase
      .from('training_institutions')
      .select('id, name, slug, type, description, logo_url, website_url, city, is_apebi_partner')
      .eq('status', 'active')
      .order('is_apebi_partner', { ascending: false })
      .order('name')
      .returns<InstitutionRow[]>(),
    supabase
      .from('domains')
      .select('id, code, name_fr, color, icon, description_fr')
      .order('name_fr')
      .returns<DomainRow[]>(),
  ])

  const programs: ProgramCardData[] = (programsResult.data ?? [])
    .filter((p) => !params.domain || p.domains?.code === params.domain)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      level: p.level,
      modality: p.modality,
      duration_text: p.duration_text,
      price_range: p.price_range,
      is_featured: p.is_featured,
      url_inscription: p.url_inscription,
      institution: p.training_institutions,
      domain: p.domains,
    }))

  return {
    programs,
    institutions: institutionsResult.data ?? [],
    domains: domainsResult.data ?? [],
  }
}

const TYPE_LABELS: Record<string, string> = {
  ecole: 'École',
  bootcamp: 'Bootcamp',
  universite: 'Université',
  certification: 'Certification',
  autre: 'Organisme',
}

export default async function FormationPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, domain, modality, level } = await searchParams
  const hasFilters = !!(q || domain || modality || level)

  const { programs, institutions, domains } = await fetchData({ q, domain, modality, level })

  const stats = [
    { label: 'Formations disponibles', value: programs.length > 0 ? programs.length : '—', icon: BookOpen },
    { label: 'Partenaires', value: institutions.length > 0 ? institutions.length : '—', icon: Building2 },
    { label: 'Domaines C5', value: domains.length, icon: GraduationCap },
  ]

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--apebi-dark-90)]">
      <Navbar />

      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-white/8 px-4 py-16 sm:px-6">
          {/* Texture réseau + lueur */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-cyan mask-radial opacity-50" />
          <div
            className="aurora pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--apebi-cyan), transparent 70%)' }}
            aria-hidden
          />

          <div className="relative mx-auto max-w-3xl text-center">
            <div
              className="rise-in mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
              style={{ borderColor: 'rgba(244,120,91,0.3)', color: 'var(--apebi-coral)', background: 'rgba(244,120,91,0.08)' }}
            >
              <GraduationCap className="size-3.5" aria-hidden />
              Formation Hub — Axe F · C5
            </div>

            <h1 className="rise-in mb-4 font-heading text-3xl font-bold text-white sm:text-4xl" style={{ animationDelay: '80ms' }}>
              Développez vos compétences{' '}
              <span className="text-gradient-cyan">tech</span>
            </h1>

            <p className="rise-in mx-auto max-w-xl text-base leading-relaxed text-white/50" style={{ animationDelay: '160ms' }}>
              Le catalogue officiel C5 des formations et certifications tech de l&apos;écosystème
              APEBI — écoles, bootcamps, parcours par domaine.
            </p>
          </div>

          {/* Stats */}
          <div className="rise-in mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4" style={{ animationDelay: '240ms' }}>
            {stats.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="card-lift flex flex-col items-center gap-1.5 rounded-2xl border border-white/8 bg-white/3 p-4 text-center hover:border-[var(--apebi-cyan)]/40 hover:shadow-glow-soft"
              >
                <Icon className="size-5 text-white/30" aria-hidden />
                <span className="font-heading text-2xl font-bold text-white">{value}</span>
                <span className="text-[11px] text-white/40">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Catalogue ─────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="mb-6 font-heading text-lg font-semibold text-white">
            Catalogue des formations
          </h2>

          <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-white/5" />}>
            <FormationFilters domains={domains} total={programs.length} />
          </Suspense>

          <div className="mt-8">
            {programs.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title={hasFilters ? 'Aucune formation trouvée' : 'Catalogue en cours de construction'}
                description={
                  hasFilters
                    ? "Essayez d'autres filtres ou réinitialisez votre recherche."
                    : "Les formations de l'écosystème APEBI seront listées ici. Revenez bientôt."
                }
                action={hasFilters ? { label: 'Réinitialiser les filtres', href: '/formation' } : undefined}
              />
            ) : (
              <ul
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                role="list"
                aria-label="Catalogue des formations"
              >
                {programs.map((program) => (
                  <li key={program.id}>
                    <ProgramCard program={program} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── Parcours par domaine ───────────────────────────── */}
        {domains.length > 0 && (
          <section className="border-t border-white/8 px-4 py-12 sm:px-6">
            <div className="mx-auto max-w-7xl">
              <h2 className="mb-2 font-heading text-lg font-semibold text-white">
                Parcours par domaine Apebi
              </h2>
              <p className="mb-8 text-[13px] text-white/40">
                Filtrez le catalogue par domaine technique pour trouver les formations qui correspondent à votre trajectoire.
              </p>

              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
                {domains.map((d) => {
                  const color = d.color ?? 'var(--apebi-cyan)'
                  return (
                    <li key={d.id}>
                      <a
                        href={`/formation?domain=${d.code}`}
                        className="group flex items-start gap-3 rounded-xl border border-white/8 bg-[var(--apebi-dark-74)] p-4 transition-all hover:border-white/16 hover:bg-[var(--apebi-dark-70)]"
                      >
                        <div
                          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-sm"
                          style={{ background: `${color}20`, color }}
                          aria-hidden
                        >
                          {d.icon ?? '⚡'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-heading text-[13px] font-semibold text-white">
                            {d.name_fr}
                          </p>
                          {d.description_fr && (
                            <p className="mt-0.5 text-[11px] leading-relaxed text-white/40 line-clamp-2">
                              {d.description_fr}
                            </p>
                          )}
                          <p className="mt-1.5 text-[11px] font-medium" style={{ color }}>
                            Voir les formations →
                          </p>
                        </div>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>
        )}

        {/* ── Partenaires ───────────────────────────────────── */}
        {institutions.length > 0 && (
          <section className="border-t border-white/8 px-4 py-12 sm:px-6">
            <div className="mx-auto max-w-7xl">
              <h2 className="mb-2 font-heading text-lg font-semibold text-white">
                Institutions partenaires
              </h2>
              <p className="mb-8 text-[13px] text-white/40">
                Écoles, bootcamps et organismes de certification reconnus par l&apos;APEBI.
              </p>

              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
                {institutions.map((inst) => (
                  <li key={inst.id}>
                    <a
                      href={inst.website_url ?? '#'}
                      target={inst.website_url ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="group flex flex-col gap-3 rounded-xl border border-white/8 bg-[var(--apebi-dark-74)] p-4 transition-all hover:border-white/16 hover:bg-[var(--apebi-dark-70)]"
                    >
                      {/* Logo placeholder */}
                      <div className="flex size-10 items-center justify-center rounded-lg bg-white/8 text-lg font-bold text-white/50">
                        {inst.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={inst.logo_url}
                            alt={inst.name}
                            className="size-10 rounded-lg object-contain"
                          />
                        ) : (
                          inst.name[0]
                        )}
                      </div>

                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-heading text-[13px] font-semibold leading-snug text-white">
                            {inst.name}
                          </p>
                          {inst.is_apebi_partner && (
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                              style={{ background: 'rgba(0,175,210,0.15)', color: 'var(--apebi-cyan)' }}
                            >
                              Partenaire
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-[11px] text-white/40">
                          {TYPE_LABELS[inst.type] ?? inst.type}
                          {inst.city && ` · ${inst.city}`}
                        </p>

                        {inst.description && (
                          <p className="mt-2 text-[11px] leading-relaxed text-white/35 line-clamp-2">
                            {inst.description}
                          </p>
                        )}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
