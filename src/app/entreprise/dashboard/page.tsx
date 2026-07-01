import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Briefcase, Users, Eye, Settings, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { AdminKpiCard } from '@/components/admin/admin-kpi-card'
import { ApplicationStatusBadge, ApplicationStatusActions, JobStatusBadge } from '@/components/shared/application-status-badge'
import { updateApplicationStatus } from './actions'
import { ReferralCard } from '@/components/shared/referral-card'
import { getReferralStats } from '@/lib/referral'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard Recruteur' }

// ── Types ────────────────────────────────────────────────────

type CompanyMemberRow = {
  company_id: string
  role_in_company: string
  full_name: string
  company_profiles: { name: string; logo_url: string | null; validation_status: string } | null
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
  talent_id: string
  status: string
  created_at: string
  talent_profiles: { first_name: string; last_name: string; title: string | null; avatar_url: string | null } | null
  job_postings: { title: string } | null
}

// ── Helpers ──────────────────────────────────────────────────

const AVATAR_COLORS = ['#3A4652', '#1E4D5C', '#2D4A3E', '#4A2D3E']
function avatarColor(name: string): string {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function timeAgo(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 30) return `Il y a ${diffDays} j`
  return `Il y a ${Math.floor(diffDays / 30)} mois`
}

// ── Page ─────────────────────────────────────────────────────

export default async function DashboardRecruteurPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: member } = await supabase
    .from('company_members')
    .select('company_id, role_in_company, full_name, company_profiles(name, logo_url, validation_status)')
    .eq('user_id', user.id)
    .maybeSingle<CompanyMemberRow>()

  // ── No company ────────────────────────────────────────────
  if (!member) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <EmptyState
          icon={Briefcase}
          title="Compte non associé"
          description="Votre compte n'est pas encore associé à une entreprise APEBI. Contactez l'équipe C5 pour activer votre accès recruteur."
        />
      </div>
    )
  }

  const company = member.company_profiles

  const { data: rawJobs } = await supabase
    .from('job_postings')
    .select('id, title, slug, contract_type, status, applications_count, views_count, created_at')
    .eq('company_id', member.company_id)
    .order('created_at', { ascending: false })
    .returns<JobRow[]>()
  const jobs: JobRow[] = rawJobs ?? []

  const jobIds = jobs.map((j) => j.id)
  const { data: rawApps } = jobIds.length > 0
    ? await supabase
        .from('applications')
        .select(`id, talent_id, status, created_at,
                 talent_profiles ( first_name, last_name, title, avatar_url ),
                 job_postings ( title )`)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
        .limit(10)
        .returns<ApplicationRow[]>()
    : { data: [] as ApplicationRow[] }
  const applications: ApplicationRow[] = rawApps ?? []

  const activeJobs = jobs.filter((j) => j.status === 'active').length
  const totalApplications = jobs.reduce((sum, j) => sum + (j.applications_count ?? 0), 0)
  const totalViews = jobs.reduce((sum, j) => sum + (j.views_count ?? 0), 0)
  const pendingApps = applications.filter((a) => a.status === 'sent').length

  // Growth C — parrainage (code + compteur)
  const referral = await getReferralStats()

  return (
    <>
        {/* ── Header ────────────────────────────────────── */}
        <div
          className="border-b px-4 py-6 sm:px-6"
          style={{ background: 'var(--apebi-bg-alt)', borderColor: 'var(--apebi-border)' }}
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-overline mb-1">Dashboard Recruteur</p>
                <h1 className="font-heading text-xl font-bold text-foreground">
                  {company?.name ?? 'Mon entreprise'}
                </h1>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Bonjour, {member.full_name}
                  <span className="mx-1.5" aria-hidden>·</span>
                  {member.role_in_company}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Link
                  href="/entreprise/profil/modifier"
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 text-xs')}
                >
                  <Settings className="size-3.5" aria-hidden />
                  Éditer ma vitrine
                </Link>
                <Link
                  href="/entreprise/offres/nouvelle"
                  className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 text-xs')}
                >
                  <Plus className="size-3.5" aria-hidden />
                  Publier une offre
                </Link>
              </div>
            </div>

            {/* KPI cards */}
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <AdminKpiCard icon={Briefcase} label="Offres actives"   value={activeJobs}        sublabel={`${jobs.length} au total`} />
              <Link href="/entreprise/candidatures">
                <AdminKpiCard icon={Users}    label="Candidatures"      value={totalApplications} sublabel="toutes offres confondues" />
              </Link>
              <AdminKpiCard icon={Eye}      label="Vues"              value={totalViews}         sublabel="vues sur vos offres" />
              <Link href="/entreprise/candidatures?tab=a-traiter">
                <AdminKpiCard icon={Clock}    label="À traiter"         value={pendingApps}        urgent={pendingApps > 0} sublabel="candidatures non lues" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────── */}
        <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">

          {/* Jobs section */}
          <section aria-labelledby="jobs-heading">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="jobs-heading" className="font-heading text-[15px] font-semibold text-foreground">
                Mes offres
                {jobs.length > 0 && (
                  <span
                    className="ml-2 rounded-full px-2 py-0.5 font-heading text-[11px] font-semibold"
                    style={{ background: 'var(--apebi-cyan-muted)', color: 'var(--apebi-cyan)' }}
                  >
                    {jobs.length}
                  </span>
                )}
              </h2>
              {jobs.length > 5 && (
                <Link href="/entreprise/offres" className="font-heading text-[12px] font-medium text-[var(--apebi-cyan)] hover:underline">
                  Voir tout →
                </Link>
              )}
            </div>

            {jobs.length === 0 ? (
              <div style={{ border: '2px dashed var(--apebi-border)', borderRadius: 12 }}>
                <EmptyState
                  icon={Briefcase}
                  title="Aucune offre publiée"
                  description="Publiez votre première offre pour commencer à recevoir des candidatures."
                  action={{ label: 'Publier une offre', href: '/entreprise/offres/nouvelle' }}
                  compact
                />
              </div>
            ) : (
              <div
                className="overflow-hidden rounded-xl"
                style={{ border: '1px solid var(--apebi-border)', boxShadow: 'var(--shadow-card)' }}
              >
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr
                      className="text-left"
                      style={{ background: 'var(--apebi-bg-alt)', borderBottom: '2px solid var(--apebi-border)' }}
                    >
                      <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Offre</th>
                      <th className="hidden px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:table-cell">Statut</th>
                      <th className="hidden px-4 py-3 text-right font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">Candidatures</th>
                      <th className="hidden px-4 py-3 text-right font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground xl:table-cell">Vues</th>
                      <th className="px-4 py-3 text-right font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Publiée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job, i) => (
                      <tr
                        key={job.id}
                        className="transition-colors hover:bg-[var(--apebi-bg-alt)]"
                        style={i < jobs.length - 1 ? { borderBottom: '1px solid var(--apebi-border)' } : undefined}
                      >
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/offres/${job.slug}`}
                            className="font-heading text-[13px] font-semibold text-foreground hover:text-[var(--apebi-cyan)] hover:underline"
                          >
                            {job.title}
                          </Link>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">{job.contract_type}</span>
                        </td>
                        <td className="hidden px-4 py-3.5 sm:table-cell">
                          <JobStatusBadge status={job.status} />
                        </td>
                        <td className="hidden px-4 py-3.5 text-right font-heading text-[13px] tabular-nums text-muted-foreground lg:table-cell">
                          {job.applications_count}
                        </td>
                        <td className="hidden px-4 py-3.5 text-right font-heading text-[13px] tabular-nums text-muted-foreground xl:table-cell">
                          {job.views_count}
                        </td>
                        <td className="px-4 py-3.5 text-right text-[11px] text-muted-foreground">
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
          {applications.length > 0 && (
            <section aria-labelledby="apps-heading">
              <h2 id="apps-heading" className="mb-4 font-heading text-[15px] font-semibold text-foreground">
                Candidatures récentes
              </h2>
              <ul
                className="overflow-hidden rounded-xl"
                role="list"
                style={{ border: '1px solid var(--apebi-border)', boxShadow: 'var(--shadow-card)' }}
              >
                {applications.map((app, i) => {
                  const talent = app.talent_profiles
                  const initials = talent
                    ? `${talent.first_name[0] ?? ''}${talent.last_name[0] ?? ''}`.toUpperCase()
                    : '?'
                  const fullName = talent ? `${talent.first_name} ${talent.last_name}` : 'Talent anonyme'

                  return (
                    <li
                      key={app.id}
                      className="flex items-start justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--apebi-bg-alt)]"
                      style={i < applications.length - 1 ? { borderBottom: '1px solid var(--apebi-border)' } : undefined}
                    >
                      {/* Left: avatar + info */}
                      <Link
                        href={`/entreprise/talents/${app.talent_id}`}
                        className="group flex min-w-0 flex-1 items-center gap-3"
                      >
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
                            className="flex size-9 shrink-0 items-center justify-center rounded-full font-heading text-[11px] font-bold text-white"
                            style={{ background: avatarColor(fullName) }}
                          >
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-heading text-[13px] font-semibold text-foreground group-hover:text-[var(--apebi-cyan)] group-hover:underline">
                            {fullName}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {app.job_postings?.title}
                            {talent?.title ? ` · ${talent.title}` : ''}
                          </p>
                        </div>
                      </Link>

                      {/* Right: status + actions */}
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <ApplicationStatusBadge status={app.status} recruiterView />
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                          {timeAgo(app.created_at)}
                        </span>
                        <ApplicationStatusActions
                          applicationId={app.id}
                          status={app.status}
                          action={updateApplicationStatus}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* ── Parrainage (Growth C) ── */}
          {referral && (
            <section className="max-w-md">
              <ReferralCard url={referral.url} invitedCount={referral.invitedCount} />
            </section>
          )}
        </div>
    </>
  )
}
