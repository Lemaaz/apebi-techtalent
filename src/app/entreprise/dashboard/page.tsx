import type { Metadata } from 'next'
import type { LucideIcon } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Briefcase, Users, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Dashboard Recruteur | APEBI TechTalent',
}

// ── Types ────────────────────────────────────────────────────

type CompanyMemberRow = {
  company_id: string
  role_in_company: string
  full_name: string
  company_profiles: {
    name: string
    logo_url: string | null
    validation_status: string
  } | null
}

type JobRow = {
  id: string
  title: string
  slug: string
  contract_type: string
  status: string
  applications_count: number
  views_count: number
  created_at: string
}

type ApplicationRow = {
  id: string
  status: string
  created_at: string
  talent_profiles: {
    first_name: string
    last_name: string
    title: string | null
    avatar_url: string | null
  } | null
  job_postings: { title: string } | null
}

// ── Helpers ──────────────────────────────────────────────────

const JOB_STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600',
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-amber-500/10 text-amber-700',
  closed: 'bg-muted text-muted-foreground',
  rejected: 'bg-rose-500/10 text-rose-600',
}

const JOB_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  draft: 'Brouillon',
  pending: 'En attente',
  closed: 'Fermée',
  rejected: 'Rejetée',
}

const APP_STATUS_STYLES: Record<string, string> = {
  sent: 'bg-muted text-muted-foreground',
  viewed: 'bg-primary/10 text-primary',
  shortlisted: 'bg-emerald-500/10 text-emerald-600',
  rejected: 'bg-rose-500/10 text-rose-600',
  accepted: 'bg-violet-500/10 text-violet-600',
}

const APP_STATUS_LABELS: Record<string, string> = {
  sent: 'Reçue',
  viewed: 'Vue',
  shortlisted: 'Présélectionné·e',
  rejected: 'Refusé·e',
  accepted: 'Accepté·e',
}

function timeAgo(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 30) return `Il y a ${diffDays} j`
  return `Il y a ${Math.floor(diffDays / 30)} mois`
}

// ── Sub-components ───────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon
  label: string
  value: number | string
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </div>
      <p className="font-heading text-2xl font-bold tabular-nums text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default async function DashboardRecruteurPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Company membership
  const { data: member } = await supabase
    .from('company_members')
    .select(
      'company_id, role_in_company, full_name, company_profiles(name, logo_url, validation_status)',
    )
    .eq('user_id', user.id)
    .maybeSingle<CompanyMemberRow>()

  // ── No company linked ────────────────────────────────────
  if (!member) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="mx-auto max-w-sm text-center">
            <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Briefcase className="size-7 text-primary" aria-hidden />
            </div>
            <h1 className="font-heading text-lg font-semibold text-foreground">
              Compte non associé
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Votre compte n&apos;est pas encore associé à une entreprise APEBI. Contactez
              l&apos;équipe C5 pour activer votre accès recruteur.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const company = member.company_profiles

  // Jobs for this company
  const { data: jobs = [] } = await supabase
    .from('job_postings')
    .select('id, title, slug, contract_type, status, applications_count, views_count, created_at')
    .eq('company_id', member.company_id)
    .order('created_at', { ascending: false })
    .returns<JobRow[]>()

  // Recent applications across this company's jobs
  const jobIds = (jobs as JobRow[]).map((j) => j.id)
  const { data: applications = [] } =
    jobIds.length > 0
      ? await supabase
          .from('applications')
          .select(
            `id, status, created_at,
             talent_profiles ( first_name, last_name, title, avatar_url ),
             job_postings ( title )`,
          )
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
          .limit(10)
          .returns<ApplicationRow[]>()
      : { data: [] as ApplicationRow[] }

  // ── Stats ─────────────────────────────────────────────────
  const activeJobs = (jobs as JobRow[]).filter((j) => j.status === 'active').length
  const totalApplications = (jobs as JobRow[]).reduce((sum, j) => sum + j.applications_count, 0)
  const totalViews = (jobs as JobRow[]).reduce((sum, j) => sum + j.views_count, 0)

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Header ────────────────────────────────── */}
        <div className="border-b border-border bg-muted/30 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Dashboard Recruteur</p>
                <h1 className="font-heading text-xl font-bold text-foreground">
                  {company?.name ?? 'Mon entreprise'}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Bonjour, {member.full_name}
                  <span className="mx-1.5 text-border" aria-hidden>
                    ·
                  </span>
                  {member.role_in_company}
                </p>
              </div>
              <Link
                href="/entreprise/offres/nouvelle"
                className={cn(buttonVariants({ size: 'sm' }), 'shrink-0 gap-1.5 text-xs')}
              >
                <Plus className="size-3.5" aria-hidden />
                Publier une offre
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatCard
                icon={Briefcase}
                label="Offres actives"
                value={activeJobs}
                sub={`${(jobs as JobRow[]).length} au total`}
              />
              <StatCard
                icon={Users}
                label="Candidatures"
                value={totalApplications}
                sub="toutes offres confondues"
              />
              <StatCard
                icon={Eye}
                label="Vues"
                value={totalViews}
                sub="vues sur vos offres"
              />
            </div>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────── */}
        <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
          {/* Jobs section */}
          <section aria-labelledby="jobs-heading">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="jobs-heading"
                className="font-heading text-base font-semibold text-foreground"
              >
                Mes offres
                {(jobs as JobRow[]).length > 0 && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {(jobs as JobRow[]).length}
                  </span>
                )}
              </h2>
              {(jobs as JobRow[]).length > 5 && (
                <Link
                  href="/entreprise/offres"
                  className="text-xs text-primary hover:underline"
                >
                  Voir tout →
                </Link>
              )}
            </div>

            {(jobs as JobRow[]).length === 0 ? (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-12 text-center">
                <Briefcase className="mb-3 size-8 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium text-foreground">Aucune offre publiée</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Publiez votre première offre pour commencer à recevoir des candidatures.
                </p>
                <Link
                  href="/entreprise/offres/nouvelle"
                  className={cn(buttonVariants({ size: 'sm' }), 'mt-4 gap-1.5 text-xs')}
                >
                  <Plus className="size-3.5" aria-hidden />
                  Publier une offre
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Offre</th>
                      <th className="hidden px-4 py-3 font-medium sm:table-cell">Statut</th>
                      <th className="hidden px-4 py-3 text-right font-medium lg:table-cell">
                        Candidatures
                      </th>
                      <th className="hidden px-4 py-3 text-right font-medium xl:table-cell">
                        Vues
                      </th>
                      <th className="px-4 py-3 text-right font-medium">Publiée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(jobs as JobRow[]).map((job) => (
                      <tr
                        key={job.id}
                        className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{job.title}</p>
                          <span className="text-xs text-muted-foreground">
                            {job.contract_type}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[11px] font-medium',
                              JOB_STATUS_STYLES[job.status] ??
                                'bg-muted text-muted-foreground',
                            )}
                          >
                            {JOB_STATUS_LABELS[job.status] ?? job.status}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-right text-xs tabular-nums text-muted-foreground lg:table-cell">
                          {job.applications_count}
                        </td>
                        <td className="hidden px-4 py-3 text-right text-xs tabular-nums text-muted-foreground xl:table-cell">
                          {job.views_count}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          {timeAgo(job.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recent applications */}
          {(applications as ApplicationRow[]).length > 0 && (
            <section aria-labelledby="apps-heading">
              <h2
                id="apps-heading"
                className="mb-4 font-heading text-base font-semibold text-foreground"
              >
                Candidatures récentes
              </h2>
              <ul
                className="divide-y divide-border overflow-hidden rounded-xl border border-border"
                role="list"
              >
                {(applications as ApplicationRow[]).map((app) => {
                  const talent = app.talent_profiles
                  const initials = talent
                    ? `${talent.first_name[0] ?? ''}${talent.last_name[0] ?? ''}`.toUpperCase()
                    : '?'
                  return (
                    <li
                      key={app.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {talent?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={talent.avatar_url}
                            alt=""
                            className="size-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            aria-hidden
                            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-xs font-bold text-primary"
                          >
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {talent
                              ? `${talent.first_name} ${talent.last_name}`
                              : 'Talent anonyme'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {app.job_postings?.title}
                            {talent?.title ? ` · ${talent.title}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-medium',
                            APP_STATUS_STYLES[app.status] ?? 'bg-muted text-muted-foreground',
                          )}
                        >
                          {APP_STATUS_LABELS[app.status] ?? app.status}
                        </span>
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                          {timeAgo(app.created_at)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
