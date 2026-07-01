import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CompanyCard } from '@/components/company/company-card'
import { CompanyFilters } from '@/components/company/company-filters'
import { EmptyState } from '@/components/ui/empty-state'

// ── Metadata ─────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Entreprises membres APEBI',
  openGraph: {
    title: 'Entreprises membres APEBI — TechTalent',
    description: "Découvrez les 260+ entreprises membres de l'APEBI qui recrutent des talents tech au Maroc.",
    url: 'https://techtalent-apebi.vercel.app/entreprises',
  },
  description:
    "Découvrez les entreprises membres de l'APEBI qui recrutent des talents tech au Maroc.",
}

// ── Types ────────────────────────────────────────────────────

type SearchParams = Promise<{
  q?: string
  sector?: string
  size?: string
  label?: string
}>

// Supabase returns embedded counts as [{ count: number }]
type CompanyRow = {
  id: string
  name: string
  slug: string
  sector: string
  company_size: string | null
  city: string | null
  logo_url: string | null
  has_techtalent_label: boolean
  apebi_member_since: string | null
  job_postings: { count: number }[]
}

// ── Data fetching ────────────────────────────────────────────

async function fetchCompanies(params: {
  q?: string
  sector?: string
  size?: string
  labelOnly?: boolean
}) {
  const supabase = await createClient()

  let query = supabase
    .from('company_profiles')
    .select(
      `id, name, slug, sector, company_size, city, logo_url,
       has_techtalent_label, apebi_member_since,
       job_postings(count)`,
    )
    .eq('validation_status', 'approved')
    .order('is_featured', { ascending: false })
    .order('name', { ascending: true })

  if (params.q) {
    query = query.ilike('name', `%${params.q}%`)
  }
  if (params.sector) {
    query = query.eq('sector', params.sector)
  }
  if (params.size) {
    query = query.eq('company_size', params.size)
  }
  if (params.labelOnly) {
    query = query.eq('has_techtalent_label', true)
  }

  const { data, error } = await query.returns<CompanyRow[]>()

  if (error) {
    console.error('[entreprises] Supabase error:', error.message)
    return []
  }

  return data ?? []
}

// ── Page ─────────────────────────────────────────────────────

export default async function EntreprisesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { q, sector, size, label } = await searchParams
  const hasFilters = !!(q || sector || size || label)

  const companies = await fetchCompanies({
    q,
    sector,
    size,
    labelOnly: label === 'true',
  })

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Header + filters ───────────────────── */}
        <div className="relative overflow-hidden border-b border-white/8 bg-[var(--apebi-dark-90)] px-4 py-10 sm:px-6">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-cyan mask-radial opacity-50" />
          <div className="relative mx-auto max-w-7xl">
            <h1 className="rise-in font-heading text-2xl font-bold text-white sm:text-3xl">
              Entreprises membres APEBI
            </h1>

            <div className="mt-4">
              <Suspense fallback={<div className="h-8 animate-pulse rounded-lg bg-white/10" />}>
                <CompanyFilters total={companies.length} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* ── Company grid ───────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {companies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={hasFilters ? 'Aucune entreprise trouvée' : 'Aucune entreprise pour le moment'}
              description={
                hasFilters
                  ? "Essayez d'autres filtres ou effacez la recherche."
                  : 'Les entreprises membres APEBI apparaîtront ici une fois validées.'
              }
              action={hasFilters ? { label: 'Effacer les filtres', href: '/entreprises' } : undefined}
            />
          ) : (
            <ul
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              role="list"
              aria-label="Liste des entreprises"
            >
              {companies.map((company) => {
                const jobCount = company.job_postings[0]?.count ?? 0
                return (
                  <li key={company.id}>
                    <CompanyCard company={company} jobCount={jobCount} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
