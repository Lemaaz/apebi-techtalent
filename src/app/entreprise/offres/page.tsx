import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil, Eye, EyeOff, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { changeJobStatus, deleteJobPosting } from './[slug]/modifier/actions'

export const metadata: Metadata = {
  title: 'Mes offres | APEBI TechTalent',
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
  published_at: string | null
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600',
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-amber-500/10 text-amber-700',
  closed: 'bg-muted/50 text-muted-foreground line-through',
  rejected: 'bg-rose-500/10 text-rose-600',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  draft: 'Brouillon',
  pending: 'En attente',
  closed: 'Fermée',
  rejected: 'Rejetée',
}

function timeAgo(dateStr: string): string {
  const ts = new Date(dateStr).getTime()
  if (isNaN(ts)) return ''
  const diffDays = Math.floor((Date.now() - ts) / 86_400_000)
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 30) return `Il y a ${diffDays} j`
  return `Il y a ${Math.floor(diffDays / 30)} mois`
}

export default async function MesOffresPage() {
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

  const { data: rawJobs } = await supabase
    .from('job_postings')
    .select(
      'id, title, slug, contract_type, status, applications_count, views_count, created_at, published_at',
    )
    .eq('company_id', member.company_id)
    .order('created_at', { ascending: false })
    .returns<JobRow[]>()
  const jobs: JobRow[] = rawJobs ?? []

  return (
      <div className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-heading text-xl font-bold text-foreground">
              Mes offres
              {jobs.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
                  {jobs.length}
                </span>
              )}
            </h1>
            <Link
              href="/entreprise/offres/nouvelle"
              className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
            >
              <Plus className="size-3.5" aria-hidden />
              Nouvelle offre
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-20 text-center">
              <p className="font-heading text-sm font-semibold text-foreground">
                Aucune offre pour le moment
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Publiez votre première offre pour commencer à recevoir des candidatures.
              </p>
              <Link
                href="/entreprise/offres/nouvelle"
                className={cn(buttonVariants({ size: 'sm' }), 'mt-6 gap-1.5')}
              >
                <Plus className="size-3.5" aria-hidden />
                Créer une offre
              </Link>
            </div>
          ) : (
            <ul className="space-y-3" role="list">
              {jobs.map((job) => (
                <li key={job.id} className="rounded-xl border border-border bg-card px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-heading text-sm font-semibold text-foreground">
                          {job.title}
                        </p>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-medium',
                            STATUS_STYLES[job.status] ?? 'bg-muted text-muted-foreground',
                          )}
                        >
                          {STATUS_LABELS[job.status] ?? job.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {job.contract_type} · {timeAgo(job.created_at)}
                        {job.published_at && ` · publiée ${timeAgo(job.published_at)}`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {job.applications_count} candidature
                        {job.applications_count !== 1 ? 's' : ''} · {job.views_count} vue
                        {job.views_count !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Link
                        href={`/entreprise/offres/${job.slug}/modifier`}
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'sm' }),
                          'gap-1 text-xs',
                        )}
                      >
                        <Pencil className="size-3" aria-hidden />
                        Modifier
                      </Link>

                      {job.status === 'draft' && (
                        <form action={changeJobStatus}>
                          <input type="hidden" name="job_id" value={job.id} />
                          <input type="hidden" name="status" value="active" />
                          <button
                            type="submit"
                            className={cn(
                              buttonVariants({ variant: 'outline', size: 'sm' }),
                              'gap-1 text-xs text-emerald-600 hover:text-emerald-700',
                            )}
                          >
                            <Eye className="size-3" aria-hidden />
                            Publier
                          </button>
                        </form>
                      )}
                      {job.status === 'active' && (
                        <form action={changeJobStatus}>
                          <input type="hidden" name="job_id" value={job.id} />
                          <input type="hidden" name="status" value="closed" />
                          <button
                            type="submit"
                            className={cn(
                              buttonVariants({ variant: 'outline', size: 'sm' }),
                              'gap-1 text-xs',
                            )}
                          >
                            <EyeOff className="size-3" aria-hidden />
                            Clôturer
                          </button>
                        </form>
                      )}
                      {job.status === 'closed' && (
                        <form action={changeJobStatus}>
                          <input type="hidden" name="job_id" value={job.id} />
                          <input type="hidden" name="status" value="active" />
                          <button
                            type="submit"
                            className={cn(
                              buttonVariants({ variant: 'outline', size: 'sm' }),
                              'gap-1 text-xs text-emerald-600',
                            )}
                          >
                            <Eye className="size-3" aria-hidden />
                            Réactiver
                          </button>
                        </form>
                      )}

                      {job.status === 'draft' && (
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
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

  )
}
