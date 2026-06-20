import type { Metadata } from 'next'
import { MapPin, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminTable, AdminTableAction, type AdminTableColumn } from '@/components/admin/admin-table'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Users } from 'lucide-react'
import { validateTalent } from './actions'

export const metadata: Metadata = { title: 'Talents — Admin' }

// ── Types ────────────────────────────────────────────────────

type TalentRow = {
  id: string
  first_name: string
  last_name: string
  title: string | null
  city: string | null
  seniority_level: string | null
  years_experience: number | null
  validation_status: string
  validation_note: string | null
  created_at: string
  talent_skills: Array<{ skills: { name: string } | null }>
}

const SENIORITY_LABELS: Record<string, string> = {
  junior: 'Junior',
  mid: 'Confirmé',
  senior: 'Senior',
  lead: 'Lead',
}

// ── Page ────────────────────────────────────────────────────

type SearchParams = Promise<{ status?: string }>

export default async function AdminTalentsPage({ searchParams }: { searchParams: SearchParams }) {
  const { status } = await searchParams
  const supabase = await createClient()

  // Counts per status for filter badges
  const [
    { count: countPending },
    { count: countApproved },
    { count: countRejected },
    { count: countTotal },
  ] = await Promise.all([
    supabase.from('talent_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'pending'),
    supabase.from('talent_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'approved'),
    supabase.from('talent_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'rejected'),
    supabase.from('talent_profiles').select('*', { count: 'exact', head: true }),
  ])

  // Talent data
  let query = supabase
    .from('talent_profiles')
    .select(
      `id, first_name, last_name, title, city, seniority_level, years_experience,
       validation_status, validation_note, created_at,
       talent_skills ( skills ( name ) )`,
    )
    .order('created_at', { ascending: false })

  if (status) query = query.eq('validation_status', status)

  const { data: talents = [] } = await query.returns<TalentRow[]>()

  // ── Table columns ────────────────────────────────────────

  const columns: AdminTableColumn<TalentRow>[] = [
    {
      key: 'identity',
      header: 'Talent',
      cell: (row) => (
        <div>
          <p className="font-heading text-[13px] font-semibold text-foreground">
            {row.first_name} {row.last_name}
          </p>
          {row.title && (
            <p className="mt-0.5 text-[12px] text-muted-foreground">{row.title}</p>
          )}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Localisation',
      width: 'w-[140px]',
      cell: (row) =>
        row.city ? (
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden />
            {row.city}
          </span>
        ) : (
          <span className="text-[12px] text-muted-foreground">—</span>
        ),
    },
    {
      key: 'seniority',
      header: 'Niveau',
      width: 'w-[100px]',
      cell: (row) => (
        <span className="text-[12px] text-muted-foreground">
          {row.seniority_level ? (SENIORITY_LABELS[row.seniority_level] ?? row.seniority_level) : '—'}
          {row.years_experience != null && ` · ${row.years_experience}a`}
        </span>
      ),
    },
    {
      key: 'skills',
      header: 'Compétences',
      cell: (row) => {
        const skills = (row.talent_skills ?? [])
          .map((ts) => ts.skills?.name)
          .filter(Boolean)
          .slice(0, 4) as string[]
        return skills.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {skills.map((s) => (
              <span key={s} className="badge-skill">{s}</span>
            ))}
          </div>
        ) : (
          <span className="text-[12px] text-muted-foreground">—</span>
        )
      },
    },
    {
      key: 'status',
      header: 'Statut',
      width: 'w-[120px]',
      cell: (row) => <AdminStatusBadge status={row.validation_status} />,
    },
    {
      key: 'date',
      header: 'Inscription',
      width: 'w-[100px]',
      align: 'right',
      cell: (row) => (
        <span className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
          <Calendar className="size-3 shrink-0" aria-hidden />
          {new Date(row.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
        </span>
      ),
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Talents"
        totalCount={countTotal ?? 0}
        description="Gestion des inscriptions et validations de profils talents"
        filterBaseHref="/admin/talents"
        activeFilter={status ?? ''}
        filters={[
          { label: 'Tous',        value: '',         count: countTotal    ?? 0 },
          { label: 'En attente',  value: 'pending',  count: countPending  ?? 0 },
          { label: 'Validés',     value: 'approved', count: countApproved ?? 0 },
          { label: 'Refusés',     value: 'rejected', count: countRejected ?? 0 },
        ]}
      />

      <AdminTable
        caption="Liste des talents APEBI TechTalent"
        columns={columns}
        data={talents ?? []}
        rowKey={(row) => row.id}
        emptyState={
          <EmptyState
            icon={Users}
            title="Aucun talent trouvé"
            description={
              status
                ? `Aucun talent avec le statut "${status}" pour l'instant.`
                : 'Les inscriptions apparaîtront ici.'
            }
            compact
          />
        }
        actions={(row) => (
          <>
            {row.validation_status === 'pending' && (
              <>
                <form
                  action={async () => {
                    'use server'
                    await validateTalent(row.id, 'approved')
                  }}
                >
                  <AdminTableAction label="Valider" variant="approve" />
                </form>
                <form
                  action={async () => {
                    'use server'
                    await validateTalent(row.id, 'rejected', 'Profil incomplet ou non conforme.')
                  }}
                >
                  <AdminTableAction label="Refuser" variant="reject" />
                </form>
              </>
            )}
            {row.validation_status !== 'pending' && (
              <form
                action={async () => {
                  'use server'
                  await validateTalent(row.id, 'pending')
                }}
              >
                <AdminTableAction label="Remettre" variant="reset" />
              </form>
            )}
          </>
        )}
      />

      {/* Validation note drawer (si note présente) */}
      {(talents ?? []).some((t) => t.validation_note) && (
        <details className="mt-4 rounded-lg border border-[var(--apebi-border)] bg-card">
          <summary className="cursor-pointer px-4 py-3 font-heading text-[12px] font-semibold text-muted-foreground">
            Notes admin ({(talents ?? []).filter((t) => t.validation_note).length})
          </summary>
          <div className="divide-y divide-[var(--apebi-border)]">
            {(talents ?? [])
              .filter((t) => t.validation_note)
              .map((t) => (
                <div key={t.id} className="px-4 py-3">
                  <p className="font-heading text-[12px] font-semibold text-foreground">
                    {t.first_name} {t.last_name}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{t.validation_note}</p>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  )
}
