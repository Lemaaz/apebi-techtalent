import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { Calendar, ExternalLink, Users, Eye } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export const metadata: Metadata = { title: 'Offres — Admin' }

type OffreRow = {
  id: string
  title: string
  slug: string
  contract_type: string
  status: string
  city: string | null
  remote_policy: string | null
  applications_count: number
  views_count: number
  created_at: string
  company_profiles: { name: string; slug: string } | null
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600',
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-amber-500/10 text-amber-700',
  closed: 'bg-muted text-muted-foreground',
  rejected: 'bg-rose-500/10 text-rose-600',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  draft: 'Brouillon',
  pending: 'En attente',
  closed: 'Fermée',
  rejected: 'Rejetée',
}

type SearchParams = Promise<{ status?: string }>

async function setOffreStatus(offreId: string, newStatus: string) {
  'use server'
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) throw new Error('Accès refusé')

  await supabase.from('job_postings').update({ status: newStatus }).eq('id', offreId)
  revalidatePath('/admin/offres')
}

export default async function AdminOffresPage({ searchParams }: { searchParams: SearchParams }) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('job_postings')
    .select(
      `id, title, slug, contract_type, status, city, remote_policy,
       applications_count, views_count, created_at,
       company_profiles ( name, slug )`,
    )
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data: offres = [] } = await query.returns<OffreRow[]>()

  const FILTERS = [
    { label: 'Toutes', value: '' },
    { label: 'En attente', value: 'pending' },
    { label: 'Actives', value: 'active' },
    { label: 'Brouillons', value: 'draft' },
    { label: 'Fermées', value: 'closed' },
  ]

  return (
    <div>
      <h1 className="mb-6 font-heading text-xl font-bold text-foreground">
        Offres
        <span className="ml-2 text-base font-normal text-muted-foreground">
          ({offres?.length ?? 0})
        </span>
      </h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map(({ label, value }) => (
          <a
            key={value}
            href={value ? `/admin/offres?status=${value}` : '/admin/offres'}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              status === value || (!status && !value)
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {label}
          </a>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Offre</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Entreprise</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Statut</th>
              <th className="hidden px-4 py-3 text-right font-medium lg:table-cell">
                <Users className="ml-auto size-3.5" />
              </th>
              <th className="hidden px-4 py-3 text-right font-medium xl:table-cell">
                <Eye className="ml-auto size-3.5" />
              </th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(offres ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Aucune offre trouvée.
                </td>
              </tr>
            ) : (
              (offres ?? []).map((offre) => (
                <tr
                  key={offre.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{offre.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {offre.contract_type}
                      {offre.city ? ` · ${offre.city}` : ''}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60">
                      {new Date(offre.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {offre.company_profiles && (
                      <Link
                        href={`/entreprises/${offre.company_profiles.slug}`}
                        target="_blank"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {offre.company_profiles.name}
                        <ExternalLink className="size-2.5" aria-hidden />
                      </Link>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        STATUS_STYLES[offre.status] ?? 'bg-muted text-muted-foreground',
                      )}
                    >
                      {STATUS_LABELS[offre.status] ?? offre.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-xs tabular-nums text-muted-foreground lg:table-cell">
                    {offre.applications_count}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-xs tabular-nums text-muted-foreground xl:table-cell">
                    {offre.views_count}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {offre.status === 'pending' && (
                        <form action={async () => { 'use server'; await setOffreStatus(offre.id, 'active') }}>
                          <button type="submit" className="rounded bg-emerald-500 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-600">
                            Activer
                          </button>
                        </form>
                      )}
                      {offre.status === 'active' && (
                        <form action={async () => { 'use server'; await setOffreStatus(offre.id, 'closed') }}>
                          <button type="submit" className="rounded border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted">
                            Fermer
                          </button>
                        </form>
                      )}
                      {(offre.status === 'closed' || offre.status === 'rejected') && (
                        <form action={async () => { 'use server'; await setOffreStatus(offre.id, 'active') }}>
                          <button type="submit" className="rounded bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20">
                            Réactiver
                          </button>
                        </form>
                      )}
                      <Link
                        href={`/offres/${offre.slug}`}
                        target="_blank"
                        className="flex items-center gap-1 rounded border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                      >
                        <ExternalLink className="size-2.5" aria-hidden />
                        Voir
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
