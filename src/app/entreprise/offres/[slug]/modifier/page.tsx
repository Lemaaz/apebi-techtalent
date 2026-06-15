import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { JobPostingForm, type SkillGroup } from '@/components/jobs/job-posting-form'
import { updateJobPosting, deleteJobPosting } from './actions'

type Params = Promise<{ slug: string }>

type SkillRow = {
  id: string
  name: string
  domains: { name: string } | null
}

type JobSkillRow = {
  skill_id: string
  is_required: boolean
}

type JobDetail = {
  id: string
  title: string
  description: string
  contract_type: string
  seniority_level: string | null
  city: string | null
  remote_policy: string | null
  salary_range: string | null
  closes_at: string | null
  status: string
  job_skills: JobSkillRow[]
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  return { title: `Modifier offre ${slug} | APEBI TechTalent` }
}

export default async function ModifierOffrePage({ params }: { params: Params }) {
  const { slug } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: member } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) redirect('/entreprises/inscription')

  const { data: job } = await supabase
    .from('job_postings')
    .select(
      `id, title, description, contract_type, seniority_level, city, remote_policy,
       salary_range, closes_at, status,
       job_skills ( skill_id, is_required )`,
    )
    .eq('slug', slug)
    .eq('company_id', member.company_id)
    .maybeSingle<JobDetail>()

  if (!job) notFound()

  const { data: skills = [] } = await supabase
    .from('skills')
    .select('id, name, domains ( name )')
    .order('name')
    .returns<SkillRow[]>()

  const grouped = (skills ?? []).reduce<Record<string, SkillGroup>>((acc, skill) => {
    const domain = skill.domains?.name ?? 'Autres'
    if (!acc[domain]) acc[domain] = { domain, skills: [] }
    acc[domain].skills.push({ id: skill.id, name: skill.name })
    return acc
  }, {})

  const skillGroups = Object.values(grouped).sort((a, b) =>
    a.domain.localeCompare(b.domain, 'fr'),
  )
  const selectedSkillIds = (job.job_skills ?? []).map((js) => js.skill_id)
  const requiredSkillIds = (job.job_skills ?? [])
    .filter((js) => js.is_required)
    .map((js) => js.skill_id)

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/entreprise/offres"
            className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Mes offres
          </Link>

          <h1 className="mb-6 font-heading text-xl font-bold text-foreground">
            Modifier l&apos;offre
          </h1>

          <div className="rounded-2xl border border-border bg-card p-6">
            <JobPostingForm
              action={updateJobPosting}
              skillGroups={skillGroups}
              jobId={job.id}
              defaults={{
                title: job.title,
                description: job.description,
                contract_type: job.contract_type,
                seniority_level: job.seniority_level,
                city: job.city,
                remote_policy: job.remote_policy,
                salary_range: job.salary_range,
                closes_at: job.closes_at,
                selectedSkillIds,
                requiredSkillIds,
              }}
              submitLabel="Enregistrer les modifications"
              extraActions={
                job.status === 'draft' ? (
                  <form action={deleteJobPosting}>
                    <input type="hidden" name="job_id" value={job.id} />
                    <button
                      type="submit"
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        'gap-1 text-xs text-muted-foreground hover:text-rose-600',
                      )}
                    >
                      <Trash2 className="size-3" aria-hidden />
                      Supprimer
                    </button>
                  </form>
                ) : null
              }
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
