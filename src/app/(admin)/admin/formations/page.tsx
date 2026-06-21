import type { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap, Star, Plus, Trash2, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { deleteFormation, toggleFeatured } from './actions'

export const metadata: Metadata = { title: 'Formations — Admin' }

type ProgramRow = {
  id: string
  title: string
  modality: string | null
  level: string | null
  duration_text: string | null
  status: string
  is_featured: boolean
  training_institutions: { name: string } | null
  domains: { name_fr: string; color: string | null } | null
}

export default async function AdminFormationsPage() {
  const supabase = await createClient()

  const { data: programs = [] } = await supabase
    .from('training_programs')
    .select(
      `id, title, modality, level, duration_text, status, is_featured,
       training_institutions ( name ),
       domains ( name_fr, color )`,
    )
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .returns<ProgramRow[]>()

  const { data: institutions = [] } = await supabase
    .from('training_institutions')
    .select('id, name')
    .eq('status', 'active')
    .order('name')

  const { data: domains = [] } = await supabase
    .from('domains')
    .select('id, name_fr')
    .order('name_fr')

  const counts = {
    total: programs?.length ?? 0,
    active: programs?.filter((p) => p.status === 'active').length ?? 0,
    draft: programs?.filter((p) => p.status === 'draft').length ?? 0,
    featured: programs?.filter((p) => p.is_featured).length ?? 0,
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Formations"
        description="Catalogue des formations tech de l'écosystème APEBI"
        totalCount={counts.total}
        filterBaseHref="/admin/formations"
        filters={[
          { label: 'Toutes', value: '', count: counts.total },
          { label: 'Actives', value: 'active', count: counts.active },
          { label: 'Brouillons', value: 'draft', count: counts.draft },
          { label: 'En avant', value: 'featured', count: counts.featured },
        ]}
        actions={
          <Link
            href="/admin/formations/nouvelle"
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
          >
            <Plus className="size-3.5" aria-hidden />
            Ajouter une formation
          </Link>
        }
      />


      {(!programs || programs.length === 0) ? (
        <EmptyState
          icon={GraduationCap}
          title="Aucune formation"
          description="Ajoutez des formations pour alimenter le catalogue public."
          action={{ label: 'Ajouter une formation', href: '/admin/formations/nouvelle' }}
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Formation</th>
                <th className="px-4 py-3 font-medium">Institution</th>
                <th className="px-4 py-3 font-medium">Domaine</th>
                <th className="px-4 py-3 font-medium">Modalité / Niveau</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {programs.map((p) => {
                const domainColor = p.domains?.color ?? '#00AFD2'
                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        {p.is_featured && (
                          <Star className="mt-0.5 size-3 shrink-0 fill-amber-400 text-amber-400" aria-label="Mise en avant" />
                        )}
                        <div>
                          <p className="font-medium text-foreground leading-snug">{p.title}</p>
                          {p.duration_text && (
                            <p className="text-[11px] text-muted-foreground">{p.duration_text}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.training_institutions?.name ?? <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {p.domains ? (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: `${domainColor}20`, color: domainColor }}
                        >
                          {p.domains.name_fr}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 text-[12px] text-muted-foreground">
                        <span>{p.modality ?? '—'}</span>
                        <span>{p.level ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-medium',
                          p.status === 'active' && 'bg-emerald-500/10 text-emerald-500',
                          p.status === 'draft' && 'bg-amber-500/10 text-amber-500',
                          p.status === 'archived' && 'bg-muted text-muted-foreground',
                        )}
                      >
                        {p.status === 'active' ? 'Active' : p.status === 'draft' ? 'Brouillon' : 'Archivée'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <Link
                          href={`/admin/formations/${p.id}/modifier`}
                          title="Modifier"
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-[var(--apebi-cyan-muted)] hover:text-[var(--apebi-cyan)]"
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </Link>
                        {/* Toggle featured */}
                        <form action={toggleFeatured}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="current" value={String(p.is_featured)} />
                          <button
                            type="submit"
                            title={p.is_featured ? 'Retirer la mise en avant' : 'Mettre en avant'}
                            className={cn(
                              'rounded p-1.5 transition-colors',
                              p.is_featured
                                ? 'text-amber-400 hover:bg-amber-400/10'
                                : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10',
                            )}
                          >
                            <Star className="size-3.5" aria-hidden />
                          </button>
                        </form>
                        {/* Delete */}
                        <form action={deleteFormation}>
                          <input type="hidden" name="id" value={p.id} />
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
