import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Briefcase, MapPin, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { ApplicationStatusBadge } from '@/components/shared/application-status-badge'

export const metadata: Metadata = {
  title: 'Mes candidatures',
}

type ApplicationRow = {
  id: string
  status: string | null
  created_at: string | null
  job_postings: {
    id: string
    title: string
    slug: string
    contract_type: string
    city: string | null
    remote_policy: string | null
    company_profiles: {
      name: string
      slug: string
      logo_url: string | null
    } | null
  } | null
}

function timeAgo(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (isNaN(diffDays)) return ''
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 30) return `Il y a ${diffDays} j`
  return `Il y a ${Math.floor(diffDays / 30)} mois`
}

export default async function CandidaturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!talent) redirect('/talent/inscription')

  const { data, error: appsError } = await supabase
    .from('applications')
    .select(
      `id, status, created_at,
       job_postings (
         id, title, slug, contract_type, city, remote_policy,
         company_profiles ( name, slug, logo_url )
       )`,
    )
    .eq('talent_id', talent.id)
    .order('created_at', { ascending: false })
    .returns<ApplicationRow[]>()

  if (appsError) console.error('[candidatures] fetch error', appsError)

  const applications = data ?? []

  // Compteurs par statut
  const counts = applications.reduce<Record<string, number>>((acc, a) => {
    const s = a.status ?? 'sent'
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">

          {/* Breadcrumb */}
          <Link
            href="/talent/profil"
            className="mb-6 inline-flex items-center gap-1.5 font-heading text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Mon profil
          </Link>

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">
                Mes candidatures
              </h1>
              {applications.length > 0 && (
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {applications.length} candidature{applications.length > 1 ? 's' : ''} envoyée{applications.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <Link
              href="/offres"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-heading text-[12px] font-semibold transition-colors"
              style={{
                background: 'var(--apebi-cyan-muted)',
                color: 'var(--apebi-cyan)',
                border: '1px solid rgba(0,175,210,0.25)',
              }}
            >
              <Briefcase className="size-3.5" aria-hidden />
              Voir les offres
            </Link>
          </div>

          {/* Status summary bar */}
          {applications.length > 0 && (
            <div
              className="mb-6 flex flex-wrap gap-2 rounded-xl p-4"
              style={{ background: 'var(--apebi-bg-alt)', border: '1px solid var(--apebi-border)' }}
            >
              {[
                { key: 'sent',        label: 'Envoyées' },
                { key: 'viewed',      label: 'Vues' },
                { key: 'shortlisted', label: 'Présélections' },
                { key: 'accepted',    label: 'Acceptées' },
                { key: 'rejected',    label: 'Refusées' },
              ]
                .filter(({ key }) => (counts[key] ?? 0) > 0)
                .map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <ApplicationStatusBadge status={key} noIcon />
                    <span className="font-heading text-[11px] font-semibold text-muted-foreground">
                      {counts[key]}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{label}</span>
                  </div>
                ))}
            </div>
          )}

          {/* Empty state */}
          {applications.length === 0 ? (
            <div
              className="rounded-xl"
              style={{ border: '2px dashed var(--apebi-border)' }}
            >
              <EmptyState
                icon={Briefcase}
                title="Aucune candidature pour le moment"
                description="Explorez les offres des entreprises membres APEBI et postulez en quelques clics."
                action={{ label: 'Voir les offres', href: '/offres' }}
              />
            </div>
          ) : (
            <ul className="space-y-3" role="list">
              {applications.map((app) => {
                const job = app.job_postings
                const company = job?.company_profiles

                return (
                  <li
                    key={app.id}
                    className="rounded-xl p-4 transition-all duration-200"
                    style={{
                      background: 'white',
                      border: '1px solid var(--apebi-border)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left — job info */}
                      <div className="min-w-0 flex-1">
                        {/* Job title */}
                        <p className="font-heading text-[14px] font-semibold text-foreground line-clamp-1">
                          {job?.title ?? 'Offre supprimée'}
                        </p>

                        {/* Company */}
                        {company && (
                          <Link
                            href={`/entreprises/${company.slug}`}
                            className="mt-0.5 inline-block font-heading text-[12px] font-medium transition-colors hover:underline"
                            style={{ color: 'var(--apebi-cyan)' }}
                          >
                            {company.name}
                          </Link>
                        )}

                        {/* Meta */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                          {job?.contract_type && (
                            <span className="badge-contract">{job.contract_type}</span>
                          )}
                          {job?.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3 shrink-0" aria-hidden />
                              {job.city}
                            </span>
                          )}
                          {job?.remote_policy && (
                            <span>{job.remote_policy}</span>
                          )}
                        </div>
                      </div>

                      {/* Right — status + date */}
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <ApplicationStatusBadge status={app.status ?? 'sent'} />
                        {app.created_at && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="size-2.5" aria-hidden />
                            {timeAgo(app.created_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* View offer link */}
                    {job?.slug && (
                      <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--apebi-border)' }}>
                        <Link
                          href={`/offres/${job.slug}`}
                          className="font-heading text-[11px] font-medium transition-colors hover:underline"
                          style={{ color: 'var(--apebi-text-muted)' }}
                        >
                          Voir l'offre →
                        </Link>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
      </div>
    </div>
  )
}
