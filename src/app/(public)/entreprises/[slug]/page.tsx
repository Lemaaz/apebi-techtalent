import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Globe,
  ExternalLink,
  MapPin,
  Users,
  Check,
  Award,
  Building2,
  ArrowLeft,
  Briefcase,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { JobListItem, type JobListItemData } from '@/components/company/job-list-item'
import { computeApebiScore } from '@/lib/apebi-score'
import { ApebiScoreBadge } from '@/components/company/apebi-score-badge'

// ── Types ────────────────────────────────────────────────────

type Params = Promise<{ slug: string }>

type RawCompany = {
  id: string
  name: string
  slug: string
  description: string | null
  culture: string | null
  logo_url: string | null
  banner_url: string | null
  website_url: string | null
  linkedin_url: string | null
  sector: string
  company_size: string | null
  city: string | null
  country: string
  apebi_member_since: string | null
  has_techtalent_label: boolean
  is_featured: boolean
  job_postings: Array<{
    id: string
    title: string
    slug: string
    contract_type: string
    seniority_level: string | null
    city: string | null
    remote_policy: string | null
    salary_range: string | null
    created_at: string
    views_count: number | null
    applications_count: number | null
    status: string
    job_skills: Array<{
      skills: { name: string } | null
    }>
  }>
}

// ── Data fetching ────────────────────────────────────────────

async function fetchCompany(slug: string): Promise<RawCompany | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('company_profiles')
    .select(
      `id, name, slug, description, culture,
       logo_url, banner_url, website_url, linkedin_url,
       sector, company_size, city, country,
       apebi_member_since, has_techtalent_label, is_featured,
       job_postings (
         id, title, slug, contract_type, seniority_level,
         city, remote_policy, salary_range, created_at,
         views_count, applications_count, status,
         job_skills (
           skills ( name )
         )
       )`,
    )
    .eq('slug', slug)
    .eq('validation_status', 'approved')
    .maybeSingle<RawCompany>()

  if (error) {
    console.error('[entreprise/slug] Supabase error:', error.message)
    return null
  }

  return data
}

// ── Metadata ─────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const company = await fetchCompany(slug)
  if (!company) return { title: 'Entreprise non trouvée' }

  return {
    title: company.name,
    description:
      company.description ??
      `Découvrez ${company.name}, entreprise membre APEBI spécialisée en ${company.sector}.`,
    openGraph: {
      title: `${company.name} `,
      description: company.description ?? undefined,
      images: company.banner_url ? [{ url: company.banner_url }] : [],
    },
  }
}

// ── Sub-components ───────────────────────────────────────────

function CompanyInitials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <div
      aria-hidden
      className="flex size-full items-center justify-center font-heading text-xl font-semibold text-[var(--apebi-cyan)]"
    >
      {initials}
    </div>
  )
}

function SizeLabel(size: string | null) {
  const MAP: Record<string, string> = {
    '1-10': '1 – 10 employés',
    '11-50': '11 – 50 employés',
    '51-200': '51 – 200 employés',
    '201-500': '201 – 500 employés',
    '500+': '500+ employés',
  }
  return size ? MAP[size] ?? size : null
}

function EmptyJobs() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-white/15 py-10 text-center">
      <Briefcase className="mb-3 size-8 text-white/25" aria-hidden />
      <p className="font-heading text-sm font-semibold text-white">Aucune offre en ce moment</p>
      <p className="mt-1 text-xs text-white/45">
        Consultez toutes les offres de l&apos;écosystème APEBI.
      </p>
      <Link
        href="/offres"
        className="mt-4 inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        Voir toutes les offres
      </Link>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default async function EntreprisePage({ params }: { params: Params }) {
  const { slug } = await params
  const company = await fetchCompany(slug)

  if (!company) notFound()

  // ENT-11 — Stats vitrine : agrégats sur les offres de l'entreprise
  const allJobPostings = company.job_postings ?? []
  const activeJobsCount = allJobPostings.filter((j) => j.status === 'active').length
  const totalViews = allJobPostings.reduce((sum, j) => sum + (j.views_count ?? 0), 0)
  const totalApplications = allJobPostings.reduce((sum, j) => sum + (j.applications_count ?? 0), 0)

  const jobs: JobListItemData[] = allJobPostings.map((j) => ({
    id: j.id,
    title: j.title,
    slug: j.slug,
    contract_type: j.contract_type,
    seniority_level: j.seniority_level,
    city: j.city,
    remote_policy: j.remote_policy,
    salary_range: j.salary_range,
    created_at: j.created_at,
    skills: (j.job_skills ?? []).map((js) => js.skills?.name).filter(Boolean) as string[],
  }))

  const sizeLabel = SizeLabel(company.company_size)
  const memberYear = company.apebi_member_since
    ? new Date(company.apebi_member_since).getFullYear()
    : null
  const apebiScore = computeApebiScore({
    apebi_member_since: company.apebi_member_since,
    has_techtalent_label: company.has_techtalent_label,
    logo_url: company.logo_url,
    activeJobCount: jobs.length,
  })

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Banner ──────────────────────────────── */}
        <div
          className="relative h-36 sm:h-48"
          style={
            company.banner_url
              ? {
                  backgroundImage: `url(${company.banner_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : { background: 'linear-gradient(135deg, var(--apebi-dark) 0%, var(--apebi-navy) 100%)' }
          }
          aria-hidden
        />

        {/* ── Company header ──────────────────────── */}
        <div className="border-b border-white/8 bg-[var(--apebi-dark-90)] px-4 pb-6 sm:px-6">
          <div className="mx-auto max-w-7xl">

            {/* Logo — overlaps banner */}
            <div className="-mt-7 mb-4 size-14 overflow-hidden rounded-xl border-2 border-[var(--apebi-dark-90)] bg-[var(--apebi-dark-85)] shadow-sm">
              {company.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logo_url}
                  alt={`Logo ${company.name}`}
                  className="size-full object-contain"
                />
              ) : (
                <CompanyInitials name={company.name} />
              )}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              {/* Name + meta */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-xl font-bold text-white">{company.name}</h1>
                  {company.is_featured && (
                    <span className="rounded-full bg-[var(--apebi-cyan)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--apebi-cyan)]">
                      En vedette
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-white/50">
                  {company.sector}
                  {company.city ? ` · ${company.city}` : ''}
                  {sizeLabel ? ` · ${sizeLabel}` : ''}
                </p>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {company.apebi_member_since && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--apebi-cyan)]/10 px-3 py-1 text-xs font-medium text-[var(--apebi-cyan)]">
                      <Check className="size-3" aria-hidden />
                      Membre APEBI{memberYear ? ` depuis ${memberYear}` : ''}
                    </span>
                  )}
                  {company.has_techtalent_label && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                      <Award className="size-3" aria-hidden />
                      Label APEBI TechTalent
                    </span>
                  )}
                  {company.city && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-3 py-1 text-xs text-white/50">
                      <MapPin className="size-3" aria-hidden />
                      {company.city}, {company.country}
                    </span>
                  )}
                  {sizeLabel && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-3 py-1 text-xs text-white/50">
                      <Users className="size-3" aria-hidden />
                      {sizeLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* External links */}
              <div className="flex shrink-0 flex-wrap gap-2">
                {company.website_url && (
                  <a
                    href={company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Globe className="size-3.5" aria-hidden />
                    Site web
                  </a>
                )}
                {company.linkedin_url && (
                  <a
                    href={company.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <ExternalLink className="size-3.5" aria-hidden />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body — two-column ───────────────────── */}
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">

          {/* ── Left : About + Culture ────────────── */}
          <div className="space-y-8 min-w-0">

            {/* Back link */}
            <Link
              href="/entreprises"
              className="inline-flex items-center gap-1 text-xs text-white/45 hover:text-white"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Toutes les entreprises
            </Link>

            {company.description && (
              <section aria-labelledby="about-heading">
                <h2
                  id="about-heading"
                  className="mb-3 font-heading text-base font-semibold text-white"
                >
                  À propos
                </h2>
                <p className="text-sm leading-relaxed text-white/55 whitespace-pre-wrap">
                  {company.description}
                </p>
              </section>
            )}

            {company.culture && (
              <section aria-labelledby="culture-heading">
                <h2
                  id="culture-heading"
                  className="mb-3 font-heading text-base font-semibold text-white"
                >
                  Culture &amp; valeurs
                </h2>
                <p className="text-sm leading-relaxed text-white/55 whitespace-pre-wrap">
                  {company.culture}
                </p>
              </section>
            )}

            {!company.description && !company.culture && (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-white/15 py-12 text-center">
                <Building2 className="mb-3 size-8 text-white/25" aria-hidden />
                <p className="text-sm text-white/45">
                  Cette entreprise n&apos;a pas encore complété sa présentation.
                </p>
              </div>
            )}
          </div>

          {/* ── Right : Score + Jobs ──────────────── */}
          <aside aria-labelledby="jobs-heading" className="space-y-6">

            {/* Score APEBI Employeur */}
            <ApebiScoreBadge score={apebiScore} variant="full" />

            {/* ENT-11 — Stats vitrine */}
            {(totalViews > 0 || totalApplications > 0 || activeJobsCount > 0) && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Offres actives', value: activeJobsCount, icon: Briefcase },
                  { label: 'Vues totales', value: totalViews, icon: Users },
                  { label: 'Candidatures', value: totalApplications, icon: Check },
                ].map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center rounded-xl border border-white/8 bg-[var(--apebi-dark-85)] p-3 text-center"
                  >
                    <Icon className="mb-1.5 size-4 text-[var(--apebi-cyan)]/70" aria-hidden />
                    <p className="font-heading text-xl font-bold text-white">{value}</p>
                    <p className="mt-0.5 text-[10px] text-white/40">{label}</p>
                  </div>
                ))}
              </div>
            )}

            <div>
            <h2
              id="jobs-heading"
              className="mb-4 font-heading text-base font-semibold text-white"
            >
              Offres actives
              {jobs.length > 0 && (
                <span className="ml-2 rounded-full bg-[var(--apebi-cyan)]/10 px-2 py-0.5 text-xs font-medium text-[var(--apebi-cyan)]">
                  {jobs.length}
                </span>
              )}
            </h2>

            {jobs.length === 0 ? (
              <EmptyJobs />
            ) : (
              <ul className="flex flex-col gap-3" role="list">
                {jobs.map((job) => (
                  <li key={job.id}>
                    <JobListItem job={job} />
                  </li>
                ))}
              </ul>
            )}
            </div>
          </aside>

        </div>
      </main>

      <Footer />
    </div>
  )
}
