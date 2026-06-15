import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Mes candidatures | APEBI TechTalent',
}

const STATUS_STYLES: Record<string, string> = {
  sent: 'bg-muted text-muted-foreground',
  viewed: 'bg-primary/10 text-primary',
  shortlisted: 'bg-emerald-500/10 text-emerald-600',
  rejected: 'bg-rose-500/10 text-rose-600',
  accepted: 'bg-violet-500/10 text-violet-600',
}

const STATUS_LABELS: Record<string, string> = {
  sent: 'Envoyée',
  viewed: 'Vue',
  shortlisted: 'Présélectionné·e',
  rejected: 'Refusée',
  accepted: 'Acceptée',
}

type ApplicationRow = {
  id: string
  status: string | null
  created_at: string | null
  cover_letter: string | null
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
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 30) return `Il y a ${diffDays} j`
  return `Il y a ${Math.floor(diffDays / 30)} mois`
}

export default async function CandidaturesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!talent) redirect('/talent/inscription')

  const { data: applications = [] } = await supabase
    .from('applications')
    .select(
      `id, status, created_at, cover_letter,
       job_postings (
         id, title, slug, contract_type, city, remote_policy,
         company_profiles ( name, slug, logo_url )
       )`,
    )
    .eq('talent_id', talent.id)
    .order('created_at', { ascending: false })
    .returns<ApplicationRow[]>()

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/talent/profil"
            className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Mon profil
          </Link>

          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-heading text-xl font-bold text-foreground">
              Mes candidatures
              {(applications as ApplicationRow[]).length > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
                  {(applications as ApplicationRow[]).length}
                </span>
              )}
            </h1>
            <Link href="/offres" className="text-xs text-primary hover:underline">
              Voir les offres →
            </Link>
          </div>

          {(applications as ApplicationRow[]).length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
              <Briefcase className="mb-3 size-8 text-muted-foreground" aria-hidden />
              <p className="font-heading text-sm font-semibold text-foreground">
                Aucune candidature pour le moment
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Explorez les offres des entreprises membres APEBI.
              </p>
              <Link
                href="/offres"
                className="mt-4 text-xs font-medium text-primary hover:underline"
              >
                Voir les offres →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3" role="list">
              {(applications as ApplicationRow[]).map((app) => {
                const job = app.job_postings
                const company = job?.company_profiles
                return (
                  <li
                    key={app.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-heading text-sm font-semibold text-foreground">
                          {job?.title ?? 'Offre supprimée'}
                        </p>
                        {company && (
                          <Link
                            href={`/entreprises/${company.slug}`}
                            className="mt-0.5 text-xs text-primary hover:underline"
                          >
                            {company.name}
                          </Link>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {job?.contract_type}
                          {job?.city ? ` · ${job.city}` : ''}
                          {job?.remote_policy ? ` · ${job.remote_policy}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-medium',
                            STATUS_STYLES[app.status ?? 'sent'] ?? 'bg-muted text-muted-foreground',
                          )}
                        >
                          {STATUS_LABELS[app.status ?? 'sent'] ?? app.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {app.created_at ? timeAgo(app.created_at) : ''}
                        </span>
                      </div>
                    </div>
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
