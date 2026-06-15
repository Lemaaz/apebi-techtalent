import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { JobFilters } from '@/components/jobs/job-filters'
import { JobCard, type JobCardData } from '@/components/jobs/job-card'

export const metadata: Metadata = {
  title: "Offres d'emploi | APEBI TechTalent",
  description: "Toutes les offres d'emploi tech des entreprises membres APEBI au Maroc.",
}

type SearchParams = Promise<{
  q?: string
  contract?: string
  remote?: string
  seniority?: string
}>

type JobRow = {
  id: string
  title: string
  slug: string
  contract_type: string
  seniority_level: string | null
  city: string | null
  remote_policy: string | null
  salary_range: string | null
  created_at: string
  job_skills: Array<{ skills: { name: string } | null }>
  company_profiles: {
    name: string
    slug: string
    logo_url: string | null
    sector: string
  } | null
}

async function fetchJobs(params: {
  q?: string
  contract?: string
  remote?: string
  seniority?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('job_postings')
    .select(
      `id, title, slug, contract_type, seniority_level, city, remote_policy,
       salary_range, created_at,
       job_skills ( skills ( name ) ),
       company_profiles ( name, slug, logo_url, sector )`,
    )
    .eq('status', 'active')
    .order('published_at', { ascending: false })

  if (params.q) {
    query = query.ilike('title', `%${params.q}%`)
  }
  if (params.contract) {
    query = query.eq('contract_type', params.contract)
  }
  if (params.remote) {
    query = query.eq('remote_policy', params.remote)
  }
  if (params.seniority) {
    query = query.eq('seniority_level', params.seniority)
  }

  const { data, error } = await query.returns<JobRow[]>()

  if (error) {
    console.error('[offres] Supabase error:', error.message)
    return []
  }

  return (data ?? []).map(
    (j): JobCardData => ({
      id: j.id,
      title: j.title,
      slug: j.slug,
      contract_type: j.contract_type,
      seniority_level: j.seniority_level,
      city: j.city,
      remote_policy: j.remote_policy,
      salary_range: j.salary_range,
      created_at: j.created_at,
      skills: (j.job_skills ?? [])
        .map((js) => js.skills?.name)
        .filter(Boolean) as string[],
      company: j.company_profiles ?? { name: '?', slug: '', logo_url: null, sector: '' },
    }),
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
        <Briefcase className="size-7 text-muted-foreground" aria-hidden />
      </div>
      <p className="font-heading text-sm font-semibold text-foreground">
        {filtered ? 'Aucune offre trouvée' : 'Aucune offre pour le moment'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {filtered
          ? "Essayez d'autres filtres."
          : 'Les offres des entreprises membres APEBI apparaîtront ici.'}
      </p>
    </div>
  )
}

export default async function OffresPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, contract, remote, seniority } = await searchParams
  const hasFilters = !!(q || contract || remote || seniority)

  const jobs = await fetchJobs({ q, contract, remote, seniority })

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Header + filters */}
        <div className="border-b border-border bg-muted/30 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <h1 className="mb-4 font-heading text-xl font-semibold text-foreground">
              Offres d&apos;emploi
            </h1>
            <Suspense fallback={<div className="h-16 animate-pulse rounded-lg bg-muted" />}>
              <JobFilters total={jobs.length} />
            </Suspense>
          </div>
        </div>

        {/* Job grid */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {jobs.length === 0 ? (
            <EmptyState filtered={hasFilters} />
          ) : (
            <ul
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              role="list"
              aria-label="Liste des offres"
            >
              {jobs.map((job) => (
                <li key={job.id}>
                  <JobCard job={job} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
