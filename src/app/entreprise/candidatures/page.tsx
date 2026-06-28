import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { AdminKpiCard } from '@/components/admin/admin-kpi-card'
import { ApplicationStatusBadge, ApplicationStatusActions } from '@/components/shared/application-status-badge'
import { updateApplicationStatus } from '@/app/entreprise/dashboard/actions'
import { RecruiterNoteForm } from '@/components/company/recruiter-note-form'

export const metadata: Metadata = { title: 'Candidatures' }

// ── Types ────────────────────────────────────────────────────

type ApplicationRow = {
  id: string
  talent_id: string
  status: string
  created_at: string
  recruiter_note: string | null
  talent_profiles: { first_name: string; last_name: string; title: string | null; avatar_url: string | null } | null
  job_postings: { title: string; slug: string } | null
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

const TAB_CONFIG = [
  { key: 'toutes',       label: 'Toutes',       statuses: null },
  { key: 'a-traiter',    label: 'À traiter',     statuses: ['sent'] },
  { key: 'shortlistees', label: 'Shortlistées',  statuses: ['viewed', 'shortlisted'] },
  { key: 'cloturees',    label: 'Clôturées',     statuses: ['accepted', 'rejected'] },
] as const

type TabKey = typeof TAB_CONFIG[number]['key']

const PAGE_SIZE = 25

// ── Page ─────────────────────────────────────────────────────

export default async function CandidaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: member } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) redirect('/entreprise/dashboard')

  const params = await searchParams
  const activeTab: TabKey = (TAB_CONFIG.find((t) => t.key === params.tab)?.key) ?? 'toutes'
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  // Fetch all company's job IDs
  const { data: jobs } = await supabase
    .from('job_postings')
    .select('id')
    .eq('company_id', member.company_id)

  const jobIds = (jobs ?? []).map((j) => j.id)

  if (jobIds.length === 0) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <EmptyState
          icon={Users}
          title="Aucune candidature reçue"
          description="Publiez une offre pour commencer à recevoir des candidatures."
          action={{ label: 'Publier une offre', href: '/entreprise/offres/nouvelle' }}
        />
      </div>
    )
  }

  const tabCfg = TAB_CONFIG.find((t) => t.key === activeTab)!

  // Build count queries per tab (for badges)
  const countAll = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .in('job_id', jobIds)

  const countATraiter = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .in('job_id', jobIds)
    .in('status', ['sent'])

  const countShortlist = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .in('job_id', jobIds)
    .in('status', ['viewed', 'shortlisted'])

  const countCloturees = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .in('job_id', jobIds)
    .in('status', ['accepted', 'rejected'])

  const tabCounts: Record<TabKey, number> = {
    'toutes':       countAll.count ?? 0,
    'a-traiter':    countATraiter.count ?? 0,
    'shortlistees': countShortlist.count ?? 0,
    'cloturees':    countCloturees.count ?? 0,
  }

  // Fetch page of applications for active tab
  const baseQuery = supabase
    .from('applications')
    .select(`id, talent_id, status, created_at, recruiter_note,
             talent_profiles ( first_name, last_name, title, avatar_url ),
             job_postings ( title, slug )`)
    .in('job_id', jobIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const { data: rawApps } = await (
    tabCfg.statuses
      ? baseQuery.in('status', tabCfg.statuses).returns<ApplicationRow[]>()
      : baseQuery.returns<ApplicationRow[]>()
  )
  const applications = rawApps ?? []
  const totalForTab = tabCounts[activeTab]
  const totalPages = Math.ceil(totalForTab / PAGE_SIZE)

  return (
    <div className="px-4 py-8 sm:px-6">
      {/* ── Header ── */}
      <div className="mb-6">
        <p className="text-overline mb-1">Espace Recruteur</p>
        <h1 className="font-heading text-xl font-bold text-foreground">Candidatures</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {tabCounts.toutes} candidature{tabCounts.toutes !== 1 ? 's' : ''} au total
        </p>
      </div>

      {/* ── KPI strip ── */}
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <AdminKpiCard icon={Users} label="Total"       value={tabCounts.toutes} />
        <AdminKpiCard icon={Users} label="À traiter"  value={tabCounts['a-traiter']} urgent={tabCounts['a-traiter'] > 0} sublabel="non lues" />
        <AdminKpiCard icon={Users} label="Shortlist"  value={tabCounts.shortlistees} />
        <AdminKpiCard icon={Users} label="Clôturées"  value={tabCounts.cloturees} />
      </div>

      {/* ── Status tabs ── */}
      <div
        className="mb-5 flex gap-1 overflow-x-auto rounded-xl p-1"
        style={{ background: 'var(--apebi-bg-alt)', border: '1px solid var(--apebi-border)' }}
        role="tablist"
      >
        {TAB_CONFIG.map(({ key, label }) => {
          const isActive = key === activeTab
          const count = tabCounts[key]
          return (
            <Link
              key={key}
              href={`/entreprise/candidatures?tab=${key}`}
              role="tab"
              aria-selected={isActive}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 font-heading text-[12px] font-medium transition-all"
              style={isActive
                ? { background: 'white', color: 'var(--apebi-cyan)', boxShadow: 'var(--shadow-card)' }
                : { color: 'var(--apebi-text-muted)' }
              }
            >
              {label}
              {count > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 font-heading text-[10px] font-bold"
                  style={
                    key === 'a-traiter' && count > 0
                      ? { background: 'var(--color-warning)', color: 'white' }
                      : isActive
                        ? { background: 'var(--apebi-cyan-muted)', color: 'var(--apebi-cyan)' }
                        : { background: 'var(--apebi-border)', color: 'var(--apebi-text-muted)' }
                  }
                >
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* ── Application list ── */}
      {applications.length === 0 ? (
        <EmptyState
          icon={Users}
          title={`Aucune candidature ${activeTab === 'a-traiter' ? 'à traiter' : activeTab === 'shortlistees' ? 'shortlistée' : activeTab === 'cloturees' ? 'clôturée' : ''}`}
          description={activeTab === 'toutes' ? 'Vos candidatures apparaîtront ici dès que des talents postuleront.' : undefined}
        />
      ) : (
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
                className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-[var(--apebi-bg-alt)]"
                style={i < applications.length - 1 ? { borderBottom: '1px solid var(--apebi-border)' } : undefined}
              >
                {/* Top row: avatar + info | status + actions */}
                <div className="flex items-center justify-between gap-3">
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
                        {app.job_postings?.title ?? '—'}
                        {talent?.title ? ` · ${talent.title}` : ''}
                        {' · '}{timeAgo(app.created_at)}
                      </p>
                    </div>
                  </Link>

                  {/* Right: status + actions */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <ApplicationStatusBadge status={app.status} recruiterView />
                    <ApplicationStatusActions
                      applicationId={app.id}
                      status={app.status}
                      action={updateApplicationStatus}
                    />
                  </div>
                </div>

                {/* Bottom: recruiter note */}
                <RecruiterNoteForm applicationId={app.id} initialNote={app.recruiter_note} />
              </li>
            )
          })}
        </ul>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/entreprise/candidatures?tab=${activeTab}&page=${page - 1}`}
              className="rounded-lg border px-3 py-1.5 font-heading text-[12px] font-medium transition-colors hover:border-[var(--apebi-cyan)] hover:text-[var(--apebi-cyan)]"
              style={{ borderColor: 'var(--apebi-border)' }}
            >
              ← Précédent
            </Link>
          )}
          <span className="text-[12px] text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/entreprise/candidatures?tab=${activeTab}&page=${page + 1}`}
              className="rounded-lg border px-3 py-1.5 font-heading text-[12px] font-medium transition-colors hover:border-[var(--apebi-cyan)] hover:text-[var(--apebi-cyan)]"
              style={{ borderColor: 'var(--apebi-border)' }}
            >
              Suivant →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
