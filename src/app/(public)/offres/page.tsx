import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { JobFilters } from '@/components/jobs/job-filters'
import { JobCard, type JobCardData } from '@/components/jobs/job-card'
import { EmptyState } from '@/components/ui/empty-state'

export const metadata: Metadata = {
  title: "Offres d'emploi",
  description: "Toutes les offres d'emploi tech des entreprises membres APEBI au Maroc.",
  openGraph: {
    title: "Offres d'emploi tech — APEBI TechTalent",
    description: "Trouvez votre prochain poste tech dans l'écosystème APEBI : développeur, data, cybersécurité, cloud, UX au Maroc.",
    url: 'https://techtalent-apebi.vercel.app/offres',
  },
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
  if (params.contract === 'missions') {
    // Pseudo-filtre "Missions" = Freelance OU Consulting
    query = query.in('contract_type', ['Freelance', 'Consulting'])
  } else if (params.contract) {
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


export default async function OffresPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, contract, remote, seniority } = await searchParams
  const hasFilters = !!(q || contract || remote || seniority)

  const jobs = await fetchJobs({ q, contract, remote, seniority })

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--apebi-dark-90)]">
      <Navbar />
      <main className="flex-1">
        {/* Header + filters */}
        <div className="border-b border-white/8 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <h1 className="mb-1 font-heading text-2xl font-bold text-white">
              Offres d&apos;emploi
            </h1>
            <p className="mb-5 text-sm text-white/45">
              Les opportunités tech des entreprises membres APEBI
            </p>
            <Suspense fallback={<div className="h-16 animate-pulse rounded-lg bg-white/5" />}>
              <JobFilters total={jobs.length} />
            </Suspense>
          </div>
        </div>

        {/* Job grid */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={hasFilters ? 'Aucune offre trouvée' : 'Aucune offre pour le moment'}
              description={
                hasFilters
                  ? "Essayez d'autres filtres ou supprimez vos critères de recherche."
                  : 'Les offres des entreprises membres APEBI apparaîtront ici.'
              }
              action={hasFilters ? { label: 'Réinitialiser les filtres', href: '/offres' } : undefined}
            />
          ) : (
            <ul
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              role="list"
              aria-label="Liste des offres"
            >
              {jobs.map((job) => (
                <li key={job.id} className="flex">
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
