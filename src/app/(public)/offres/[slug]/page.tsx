import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Wifi,
  Calendar,
  Building2,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { ApplyForm } from './_apply-form'
import { ShareOfferButton } from '@/components/jobs/share-offer-button'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://techtalent-apebi.vercel.app'

type Params = Promise<{ slug: string }>

type JobDetailRow = {
  id: string
  title: string
  slug: string
  description: string
  contract_type: string
  seniority_level: string | null
  city: string | null
  remote_policy: string | null
  salary_range: string | null
  closes_at: string | null
  published_at: string | null
  created_at: string
  views_count: number
  applications_count: number
  job_skills: Array<{ is_required: boolean; skills: { name: string } | null }>
  company_profiles: {
    id: string
    name: string
    slug: string
    logo_url: string | null
    sector: string
    city: string | null
    website_url: string | null
  } | null
}

const fetchJob = cache(async function fetchJob(slug: string): Promise<JobDetailRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('job_postings')
    .select(
      `id, title, slug, description, contract_type, seniority_level, city,
       remote_policy, salary_range, closes_at, published_at, created_at,
       views_count, applications_count,
       job_skills ( is_required, skills ( name ) ),
       company_profiles ( id, name, slug, logo_url, sector, city, website_url )`,
    )
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle<JobDetailRow>()

  if (error) {
    console.error('[offres/slug] Supabase error:', error.message)
    return null
  }

  return data
})

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const job = await fetchJob(slug)
  if (!job) return { title: 'Offre non trouvée' }
  return {
    title: `${job.title} — ${job.company_profiles?.name ?? ''} `,
    description: job.description.slice(0, 160),
  }
}

export default async function OffreDetailPage({ params }: { params: Params }) {
  const { slug } = await params
  const job = await fetchJob(slug)

  if (!job) notFound()

  // Increment views_count (fire-and-forget)
  const supabase = await createClient()
  supabase
    .from('job_postings')
    .update({ views_count: job.views_count + 1 })
    .eq('id', job.id)
    .then(() => {})

  // Auth state for apply form
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  let hasProfile = false
  if (user) {
    const { data: talent } = await supabase
      .from('talent_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    hasProfile = !!talent
  }

  const company = job.company_profiles

  // OFF-08 — Offres similaires (même contract_type, exclut l'offre courante, limite 3)
  const { data: similarJobs } = await supabase
    .from('job_postings')
    .select('id, title, slug, contract_type, city, company_profiles ( name, slug )')
    .eq('status', 'active')
    .eq('contract_type', job.contract_type)
    .neq('id', job.id)
    .order('published_at', { ascending: false })
    .limit(3)
    .returns<Array<{
      id: string; title: string; slug: string; contract_type: string; city: string | null
      company_profiles: { name: string; slug: string } | null
    }>>()

  const requiredSkills = (job.job_skills ?? [])
    .filter((js) => js.is_required && js.skills)
    .map((js) => js.skills!.name)
  const optionalSkills = (job.job_skills ?? [])
    .filter((js) => !js.is_required && js.skills)
    .map((js) => js.skills!.name)

  const publishedDaysAgo = job.published_at
    ? Math.floor((Date.now() - new Date(job.published_at).getTime()) / 86_400_000)
    : null

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Back */}
          <Link
            href="/offres"
            className="mb-6 inline-flex items-center gap-1 text-xs text-[var(--apebi-text-light)] hover:text-[var(--apebi-text)]"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Toutes les offres
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            {/* ── Left: Job content ── */}
            <div className="space-y-6 min-w-0">
              {/* Header */}
              <div>
                {company && (
                  <Link
                    href={`/entreprises/${company.slug}`}
                    className="mb-2 inline-flex items-center gap-2 text-sm text-[#0E6E85] hover:underline"
                  >
                    {company.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={company.logo_url}
                        alt={`Logo ${company.name}`}
                        className="size-5 object-contain"
                      />
                    ) : (
                      <Building2 className="size-4" aria-hidden />
                    )}
                    {company.name}
                  </Link>
                )}

                <h1 className="font-heading text-2xl font-bold text-[var(--apebi-text)]">{job.title}</h1>

                {/* Meta chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--apebi-cyan-muted)] px-3 py-1 text-xs font-medium text-[#0E6E85]">
                    {job.contract_type}
                  </span>
                  {job.seniority_level && (
                    <span className="rounded-full bg-[var(--apebi-bg-alt)] px-3 py-1 text-xs text-[var(--apebi-text-muted)]">
                      {job.seniority_level}
                    </span>
                  )}
                  {job.city && (
                    <span className="flex items-center gap-1 rounded-full bg-[var(--apebi-bg-alt)] px-3 py-1 text-xs text-[var(--apebi-text-muted)]">
                      <MapPin className="size-3" aria-hidden />
                      {job.city}
                    </span>
                  )}
                  {job.remote_policy && (
                    <span className="flex items-center gap-1 rounded-full bg-[var(--apebi-bg-alt)] px-3 py-1 text-xs text-[var(--apebi-text-muted)]">
                      <Wifi className="size-3" aria-hidden />
                      {job.remote_policy}
                    </span>
                  )}
                  {job.salary_range && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      {job.salary_range}
                    </span>
                  )}
                </div>

                {/* Dates */}
                <div className="mt-3 flex items-center gap-4 text-xs text-[var(--apebi-text-light)]">
                  {publishedDaysAgo !== null && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" aria-hidden />
                      Publiée{' '}
                      {publishedDaysAgo === 0
                        ? "aujourd'hui"
                        : publishedDaysAgo === 1
                          ? 'hier'
                          : `il y a ${publishedDaysAgo} jours`}
                    </span>
                  )}
                  {job.closes_at && (
                    <span className="flex items-center gap-1 text-amber-700">
                      <Calendar className="size-3" aria-hidden />
                      Clôture le{' '}
                      {new Date(job.closes_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* OFF-07 — Partager l'offre */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[12px] text-[var(--apebi-text-light)]">Partager :</span>
                <ShareOfferButton
                  offerUrl={`${APP_URL}/offres/${job.slug}`}
                  title={job.title}
                />
              </div>

              {/* Description */}
              <section aria-labelledby="desc-heading">
                <h2
                  id="desc-heading"
                  className="mb-3 font-heading text-base font-semibold text-[var(--apebi-text)]"
                >
                  Description du poste
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--apebi-text-muted)]">
                  {job.description}
                </p>
              </section>

              {/* Skills */}
              {(requiredSkills.length > 0 || optionalSkills.length > 0) && (
                <section aria-labelledby="skills-heading">
                  <h2
                    id="skills-heading"
                    className="mb-3 font-heading text-base font-semibold text-[var(--apebi-text)]"
                  >
                    Compétences
                  </h2>
                  {requiredSkills.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--apebi-text-light)]">
                        Requises
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {requiredSkills.map((s) => (
                          <span
                            key={s}
                            className="badge-skill"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {optionalSkills.length > 0 && (
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--apebi-text-light)]">
                        Un plus
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {optionalSkills.map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-[var(--apebi-border)] bg-[var(--apebi-bg-alt)] px-2.5 py-1 text-xs text-[var(--apebi-text-muted)]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* ── Right: Sidebar ── */}
            <aside className="space-y-4">
              {/* Apply box */}
              <div className="rounded-xl border border-[var(--apebi-border)] bg-white p-5 shadow-[var(--shadow-card)]">
                <p className="mb-4 font-heading text-sm font-semibold text-[var(--apebi-text)]">
                  Postuler à cette offre
                </p>
                <ApplyForm
                  jobId={job.id}
                  isAuthenticated={isAuthenticated}
                  hasProfile={hasProfile}
                />
              </div>

              {/* Company card */}
              {company && (
                <div className="rounded-xl border border-[var(--apebi-border)] bg-white p-4 shadow-[var(--shadow-card)]">
                  <p className="mb-3 font-heading text-sm font-semibold text-[var(--apebi-text)]">
                    L&apos;entreprise
                  </p>
                  <p className="text-sm font-medium text-[var(--apebi-text)]">{company.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--apebi-text-muted)]">{company.sector}</p>
                  {company.city && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-[var(--apebi-text-muted)]">
                      <MapPin className="size-3" aria-hidden />
                      {company.city}
                    </p>
                  )}
                  <div className="mt-3 flex flex-col gap-2">
                    <Link
                      href={`/entreprises/${company.slug}`}
                      className="inline-flex items-center justify-start gap-1.5 rounded-lg border border-[var(--apebi-border)] bg-white px-3 py-1.5 text-xs text-[var(--apebi-text)] transition-colors hover:bg-[var(--apebi-bg-alt)]"
                    >
                      <Building2 className="size-3.5" aria-hidden />
                      Voir la vitrine
                    </Link>
                    {company.website_url && (
                      <a
                        href={company.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-start gap-1.5 rounded-lg border border-[var(--apebi-border)] bg-white px-3 py-1.5 text-xs text-[var(--apebi-text)] transition-colors hover:bg-[var(--apebi-bg-alt)]"
                      >
                        <ExternalLink className="size-3.5" aria-hidden />
                        Site web
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="rounded-xl border border-[var(--apebi-border)] bg-[var(--apebi-bg-alt)] p-4">
                <dl className="flex justify-around text-center">
                  <div>
                    <dt className="text-[11px] text-[var(--apebi-text-light)]">Candidatures</dt>
                    <dd className="font-heading text-lg font-bold text-[var(--apebi-text)]">
                      {job.applications_count}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-[var(--apebi-text-light)]">Vues</dt>
                    <dd className="font-heading text-lg font-bold text-[var(--apebi-text)]">
                      {job.views_count}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </div>

        {/* OFF-08 — Offres similaires */}
        {similarJobs && similarJobs.length > 0 && (
          <section aria-labelledby="similar-heading" className="mt-12 border-t border-[var(--apebi-border)] pt-8">
            <h2 id="similar-heading" className="mb-4 font-heading text-base font-semibold text-[var(--apebi-text)]">
              Offres similaires
            </h2>
            <ul className="grid gap-3 sm:grid-cols-3" role="list">
              {similarJobs.map((similar) => (
                <li key={similar.id}>
                  <Link
                    href={`/offres/${similar.slug}`}
                    className="block rounded-xl border border-[var(--apebi-border)] bg-white p-4 shadow-[var(--shadow-card)] transition-all hover:border-[var(--apebi-cyan)] hover:shadow-[var(--shadow-card-hover)]"
                  >
                    <p className="truncate font-heading text-[13px] font-semibold text-[var(--apebi-text)]">
                      {similar.title}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--apebi-text-light)]">
                      {similar.company_profiles?.name ?? '—'}
                      {similar.city ? ` · ${similar.city}` : ''}
                    </p>
                    <span className="mt-2 inline-block rounded-full bg-[var(--apebi-cyan-muted)] px-2 py-0.5 text-[10px] font-medium text-[#0E6E85]">
                      {similar.contract_type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
