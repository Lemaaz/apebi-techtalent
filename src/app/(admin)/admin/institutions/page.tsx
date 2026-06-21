import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, Plus, Trash2, Award, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { deleteInstitution, togglePartner } from './actions'

export const metadata: Metadata = { title: 'Institutions — Admin' }

const TYPE_LABELS: Record<string, string> = {
  ecole: 'École',
  bootcamp: 'Bootcamp',
  universite: 'Université',
  certification: 'Certification',
  autre: 'Organisme',
}

type InstitutionRow = {
  id: string
  name: string
  type: string
  city: string | null
  website_url: string | null
  is_apebi_partner: boolean
  status: string
}

export default async function AdminInstitutionsPage() {
  const supabase = await createClient()

  const { data: institutions = [] } = await supabase
    .from('training_institutions')
    .select('id, name, type, city, website_url, is_apebi_partner, status')
    .order('is_apebi_partner', { ascending: false })
    .order('name')
    .returns<InstitutionRow[]>()

  const counts = {
    total: institutions?.length ?? 0,
    partners: institutions?.filter((i) => i.is_apebi_partner).length ?? 0,
    active: institutions?.filter((i) => i.status === 'active').length ?? 0,
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Institutions partenaires"
        description="Écoles, bootcamps et organismes de l'écosystème APEBI"
        totalCount={counts.total}
        filterBaseHref="/admin/institutions"
        filters={[
          { label: 'Toutes', value: '', count: counts.total },
          { label: 'Actives', value: 'active', count: counts.active },
          { label: 'Partenaires', value: 'partner', count: counts.partners },
        ]}
        actions={
          <Link
            href="/admin/institutions/nouvelle"
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
          >
            <Plus className="size-3.5" aria-hidden />
            Ajouter une institution
          </Link>
        }
      />

      {(!institutions || institutions.length === 0) ? (
        <EmptyState
          icon={Building2}
          title="Aucune institution"
          description="Ajoutez des écoles et bootcamps partenaires pour enrichir le Formation Hub."
          action={{ label: 'Ajouter une institution', href: '/admin/institutions/nouvelle' }}
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Institution</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Ville</th>
                <th className="px-4 py-3 font-medium">Partenaire</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {institutions.map((inst) => (
                <tr key={inst.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{inst.name}</p>
                      {inst.website_url && (
                        <a
                          href={inst.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-muted-foreground hover:text-primary"
                        >
                          {inst.website_url.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {TYPE_LABELS[inst.type] ?? inst.type}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {inst.city ?? <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <form action={togglePartner}>
                      <input type="hidden" name="id" value={inst.id} />
                      <input type="hidden" name="current" value={String(inst.is_apebi_partner)} />
                      <button
                        type="submit"
                        title={inst.is_apebi_partner ? 'Retirer le statut partenaire' : 'Marquer comme partenaire'}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
                          inst.is_apebi_partner
                            ? 'bg-[rgba(0,175,210,0.15)] text-[#00AFD2] hover:bg-[rgba(0,175,210,0.1)]'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                      >
                        <Award className="size-3" aria-hidden />
                        {inst.is_apebi_partner ? 'Partenaire' : 'Aucun'}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        inst.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500',
                      )}
                    >
                      {inst.status === 'active' ? 'Active' : 'Brouillon'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/institutions/${inst.id}/modifier`}
                      title="Modifier"
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-[var(--apebi-cyan-muted)] hover:text-[var(--apebi-cyan)]"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </Link>
                    <form action={deleteInstitution}>
                      <input type="hidden" name="id" value={inst.id} />
                      <button
                        type="submit"
                        title="Supprimer"
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
