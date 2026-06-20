import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, MapPin, Briefcase, Clock, Users, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { JobMatchingPanel } from '@/components/matching/matching-panel'

type Params = Promise<{ slug: string }>

type JobDetail = {
  id: string
  title: string
  description: string
  contract_type: string
  seniority_level: string | null
  city: string | null
  remote_policy: string | null
  salary_range: string | null
  mission_duration: string | null
  status: string
  applications_count: number | null
  views_count: number | null
  published_at: string | null
  created_at: string
  job_skills: Array<{
    is_required: boolean
    skills: { name: string } | null
  }>
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  return { title: `Offre ${slug} | APEBI TechTalent` }
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active', draft: 'Brouillon', pending: 'En attente',
  closed: 'Fermée', rejected: 'Rejetée',
}
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-500',
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-amber-500/10 text-amber-700',
  closed: 'bg-muted/50 text-muted-foreground',
  rejected: 'bg-rose-500/10 text-rose-600',
}

export default async function OffreDetailPage({ params }: { params: Params }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
      `id, title, description, contract_type, seniority_level, city,
       remote_policy, salary_range, mission_duration, status,
       applications_count, views_count, published_at, created_at,
       job_skills ( is_required, skills ( name ) )`,
    )
    .eq('slug', slug)
    .eq('company_id', member.company_id)
    .maybeSingle<JobDetail>()

  if (!job) notFound()

  const requiredSkills = (job.job_skills ?? []).filter((js) => js.is_required).map((js) => js.skills?.name).filter(Boolean)
  const optionalSkills = (job.job_skills ?? []).filter((js) => !js.is_required).map((js) => js.skills?.name).filter(Boolean)

  const isMission = ['Freelance', 'Consulting'].includes(job.contract_type)

  return (
    <div className="flex min-h-dvh flex-col bg-[#0F0F0F]">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">

          {/* Back */}
          <Link
            href="/entreprise/offres"
            className="mb-6 inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Mes offres
          </Link>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

            {/* ── Left: job details ─────────────────────────── */}
            <div className="space-y-5">
              {/* Header */}
              <div className="rounded-2xl border border-white/8 bg-[#1A1A1A] p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="font-heading text-xl font-bold text-white">{job.title}</h1>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-white/40">
                      {job.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" aria-hidden />
                          {job.city}
                        </span>
                      )}
                      {job.remote_policy && <span>· {job.remote_policy}</span>}
                      <span>· {job.contract_type}</span>
                      {job.seniority_level && <span>· {job.seniority_level}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', STATUS_COLORS[job.status])}>
                      {STATUS_LABELS[job.status] ?? job.status}
                    </span>
                    <Link
                      href={`/entreprise/offres/${slug}/modifier`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Modifier
                    </Link>
                  </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Users, label: 'Candidatures', value: job.applications_count ?? 0 },
                    { icon: Briefcase, label: 'Vues', value: job.views_count ?? 0 },
                    {
                      icon: Clock,
                      label: 'Publiée',
                      value: job.published_at
                        ? new Date(job.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                        : '—',
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-xl border border-white/6 bg-white/3 p-3 text-center">
                      <Icon className="mx-auto mb-1 size-4 text-white/30" aria-hidden />
                      <p className="font-heading text-lg font-bold text-white">{value}</p>
                      <p className="text-[10px] text-white/35">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              {(requiredSkills.length > 0 || optionalSkills.length > 0) && (
                <div className="rounded-2xl border border-white/8 bg-[#1A1A1A] p-5">
                  <h2 className="mb-3 font-heading text-sm font-semibold text-white">Compétences</h2>
                  {requiredSkills.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Requises</p>
                      <div className="flex flex-wrap gap-1.5">
                        {requiredSkills.map((s) => (
                          <span key={s} className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-400">
                            ★ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {optionalSkills.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Souhaitées</p>
                      <div className="flex flex-wrap gap-1.5">
                        {optionalSkills.map((s) => (
                          <span key={s} className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-white/50">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Conditions */}
              <div className="rounded-2xl border border-white/8 bg-[#1A1A1A] p-5">
                <h2 className="mb-3 font-heading text-sm font-semibold text-white">Conditions</h2>
                <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
                  {[
                    { label: isMission ? 'TJM / Budget' : 'Salaire', value: job.salary_range },
                    { label: 'Durée mission', value: isMission ? job.mission_duration : null },
                    { label: 'Télétravail', value: job.remote_policy },
                    { label: 'Localisation', value: job.city },
                  ]
                    .filter((r) => r.value)
                    .map(({ label, value }) => (
                      <div key={label}>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/30">{label}</dt>
                        <dd className="mt-0.5 text-white/60">{value}</dd>
                      </div>
                    ))}
                </dl>
              </div>

              {/* Description */}
              <div className="rounded-2xl border border-white/8 bg-[#1A1A1A] p-5">
                <h2 className="mb-3 font-heading text-sm font-semibold text-white">Description</h2>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/55">
                  {job.description}
                </p>
              </div>
            </div>

            {/* ── Right: matching panel ──────────────────────── */}
            <div className="space-y-4">
              <JobMatchingPanel jobId={job.id} />

              {/* Quick links */}
              <div className="rounded-xl border border-white/8 bg-[#1A1A1A] p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                  Actions
                </p>
                <div className="flex flex-col gap-1.5">
                  <Link
                    href={`/offres/${slug}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-white/50 hover:bg-white/5 hover:text-white transition-colors"
                    target="_blank"
                  >
                    <Briefcase className="size-3.5" aria-hidden />
                    Vue publique de l&apos;offre
                  </Link>
                  <Link
                    href="/entreprise/recherche-talents"
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-white/50 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Users className="size-3.5" aria-hidden />
                    Recherche manuelle de talents
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
