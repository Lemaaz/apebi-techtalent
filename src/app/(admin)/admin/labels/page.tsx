import type { Metadata } from 'next'
import { Award, Building2, User, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminTable, AdminTableAction, type AdminTableColumn } from '@/components/admin/admin-table'
import { EmptyState } from '@/components/ui/empty-state'
import { reviewLabel } from './actions'

export const metadata: Metadata = { title: 'Labels — Admin' }

// Statuts du dossier Label → libellé FR + classe badge existante.
const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft:        { label: 'Brouillon', cls: 'badge-contract' },
  submitted:    { label: 'Soumis',    cls: 'badge-pending' },
  under_review: { label: 'En examen', cls: 'badge-pending' },
  approved:     { label: 'Approuvé',  cls: 'badge-approved' },
  rejected:     { label: 'Refusé',    cls: 'badge-rejected' },
}

type LabelRow = {
  id: string
  applicant_type: 'talent' | 'enterprise'
  status: string
  submitted_at: string | null
  notes_admin: string | null
  talent_profiles: { first_name: string; last_name: string } | null
  company_profiles: { name: string } | null
}

type SearchParams = Promise<{ status?: string }>

export default async function AdminLabelsPage({ searchParams }: { searchParams: SearchParams }) {
  const { status } = await searchParams
  const supabase = await createClient()

  const [
    { count: countSubmitted },
    { count: countReview },
    { count: countApproved },
    { count: countRejected },
    { count: countTotal },
  ] = await Promise.all([
    supabase.from('label_applications').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('label_applications').select('*', { count: 'exact', head: true }).eq('status', 'under_review'),
    supabase.from('label_applications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('label_applications').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('label_applications').select('*', { count: 'exact', head: true }),
  ])

  let query = supabase
    .from('label_applications')
    .select(
      `id, applicant_type, status, submitted_at, notes_admin,
       talent_profiles ( first_name, last_name ),
       company_profiles ( name )`,
    )
    .order('submitted_at', { ascending: false, nullsFirst: false })

  if (status) query = query.eq('status', status)

  const { data: rows = [] } = await query.returns<LabelRow[]>()

  const columns: AdminTableColumn<LabelRow>[] = [
    {
      key: 'candidate',
      header: 'Candidat',
      cell: (row) => {
        const isTalent = row.applicant_type === 'talent'
        const name = isTalent
          ? `${row.talent_profiles?.first_name ?? ''} ${row.talent_profiles?.last_name ?? ''}`.trim()
          : row.company_profiles?.name ?? '—'
        const Icon = isTalent ? User : Building2
        return (
          <div className="flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="font-heading text-[13px] font-semibold text-foreground">{name || '—'}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {isTalent ? 'Talent' : 'Entreprise'}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Statut',
      width: 'w-[120px]',
      cell: (row) => {
        const b = STATUS_BADGE[row.status] ?? { label: row.status, cls: 'badge-contract' }
        return <span className={b.cls}>{b.label}</span>
      },
    },
    {
      key: 'submitted',
      header: 'Soumis le',
      width: 'w-[110px]',
      align: 'right',
      cell: (row) =>
        row.submitted_at ? (
          <span className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
            <Calendar className="size-3 shrink-0" aria-hidden />
            {new Date(row.submitted_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        ),
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Labels APEBI TechTalent"
        totalCount={countTotal ?? 0}
        description="Examen des candidatures au Label (Axe B). L'approbation génère le badge vérifiable."
        filterBaseHref="/admin/labels"
        activeFilter={status ?? ''}
        filters={[
          { label: 'Tous',       value: '',             count: countTotal     ?? 0 },
          { label: 'Soumis',     value: 'submitted',    count: countSubmitted ?? 0 },
          { label: 'En examen',  value: 'under_review', count: countReview    ?? 0 },
          { label: 'Approuvés',  value: 'approved',     count: countApproved  ?? 0 },
          { label: 'Refusés',    value: 'rejected',     count: countRejected  ?? 0 },
        ]}
      />

      <AdminTable
        caption="Dossiers de Label APEBI TechTalent"
        columns={columns}
        data={rows ?? []}
        rowKey={(row) => row.id}
        emptyState={
          <EmptyState
            icon={Award}
            title="Aucun dossier de Label"
            description={
              status
                ? `Aucun dossier avec le statut "${STATUS_BADGE[status]?.label ?? status}".`
                : 'Les candidatures au Label apparaîtront ici.'
            }
            compact
          />
        }
        actions={(row) => (
          <>
            {(row.status === 'submitted' || row.status === 'under_review') && (
              <>
                <form
                  action={async () => {
                    'use server'
                    await reviewLabel(row.id, 'approve')
                  }}
                >
                  <AdminTableAction label="Approuver" variant="approve" />
                </form>
                <form
                  action={async () => {
                    'use server'
                    await reviewLabel(row.id, 'reject', 'Dossier non conforme aux critères du Label.')
                  }}
                >
                  <AdminTableAction label="Refuser" variant="reject" />
                </form>
                {row.status === 'submitted' && (
                  <form
                    action={async () => {
                      'use server'
                      await reviewLabel(row.id, 'under_review')
                    }}
                  >
                    <AdminTableAction label="Mettre en examen" variant="reset" />
                  </form>
                )}
              </>
            )}
          </>
        )}
      />
    </div>
  )
}
