import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { JobCard, type JobCardData } from '@/components/jobs/job-card'
import { SaveJobButton } from '@/components/jobs/save-job-button'

export const metadata: Metadata = { title: 'Offres sauvegardées | APEBI TechTalent' }

type SavedJobRow = {
  job_id: string
  job_postings: {
    id: string
    title: string
    slug: string
    contract_type: string
    seniority_level: string | null
    city: string | null
    remote_policy: string | null
    salary_range: string | null
    created_at: string
    status: string
    job_skills: Array<{ skills: { name: string } | null }>
    company_profiles: {
      name: string
      slug: string
      logo_url: string | null
      sector: string
    } | null
  } | null
}

export default async function OffresSauvegardeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!talent) redirect('/talent/inscription')

  const { data: savedRows = [] } = await supabase
    .from('saved_jobs')
    .select(`
      job_id,
      job_postings (
        id, title, slug, contract_type, seniority_level, city, remote_policy,
        salary_range, created_at, status,
        job_skills ( skills ( name ) ),
        company_profiles ( name, slug, logo_url, sector )
      )
    `)
    .eq('talent_id', talent.id)
    .order('saved_at', { ascending: false })

  const jobs: JobCardData[] = (savedRows as SavedJobRow[])
    .filter((s) => s.job_postings !== null)
    .map((s) => {
      const j = s.job_postings!
      return {
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
        company: {
          name: j.company_profiles?.name ?? '',
          slug: j.company_profiles?.slug ?? '',
          logo_url: j.company_profiles?.logo_url ?? null,
          sector: j.company_profiles?.sector ?? '',
        },
      }
    })

  const savedJobIds = new Set((savedRows as SavedJobRow[]).map((s) => s.job_id))

  return (
    <>
      <div>
        <div
          className="border-b px-4 py-6 sm:px-6"
          style={{ background: 'var(--apebi-bg-alt)', borderColor: 'var(--apebi-border)' }}
        >
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-overline mb-1">Mon espace talent</p>
                <h1 className="font-heading text-xl font-semibold text-foreground">
                  Offres sauvegardées
                </h1>
              </div>
              <Link
                href="/offres"
                className="font-heading text-[12px] font-medium text-muted-foreground hover:text-foreground"
              >
                ← Toutes les offres
              </Link>
            </div>
            <p className="mt-2 font-sans text-[12px] text-muted-foreground">
              <span className="font-semibold text-foreground">{jobs.length}</span>{' '}
              offre{jobs.length !== 1 ? 's' : ''} sauvegardée{jobs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {jobs.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="Aucune offre sauvegardée"
              description="Sauvegardez les offres qui vous intéressent pour les retrouver facilement."
              action={{ label: 'Parcourir les offres', href: '/offres' }}
            />
          ) : (
            <ul className="space-y-4" role="list" aria-label={`${jobs.length} offres sauvegardées`}>
              {jobs.map((job) => (
                <li key={job.id} className="relative">
                  <JobCard job={job} />
                  <div className="absolute right-3 top-3">
                    <SaveJobButton
                      jobId={job.id}
                      isSaved={savedJobIds.has(job.id)}
                      size="sm"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
