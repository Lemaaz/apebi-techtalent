import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Calendar, Globe, ExternalLink, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminTable, AdminTableAction, type AdminTableColumn } from '@/components/admin/admin-table'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Building2 } from 'lucide-react'
import { validateCompany, deactivateCompany, toggleFeatured } from './actions'

export const metadata: Metadata = { title: 'Entreprises — Admin' }

// ── Types ────────────────────────────────────────────────────

type CompanyRow = {
  id: string
  name: string
  slug: string
  sector: string
  city: string | null
  company_size: string | null
  website_url: string | null
  description: string | null
  validation_status: string
  validation_note: string | null
  created_at: string
  is_featured: boolean
}

// ── Page ────────────────────────────────────────────────────

type SearchParams = Promise<{ status?: string }>

export default async function AdminEntreprisesPage({ searchParams }: { searchParams: SearchParams }) {
  const { status } = await searchParams
  const supabase = await createClient()

  // Counts per status
  const [
    { count: countPending },
    { count: countApproved },
    { count: countRejected },
    { count: countTotal },
  ] = await Promise.all([
    supabase.from('company_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'pending'),
    supabase.from('company_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'approved'),
    supabase.from('company_profiles').select('*', { count: 'exact', head: true }).eq('validation_status', 'rejected'),
    supabase.from('company_profiles').select('*', { count: 'exact', head: true }),
  ])

  // Company data
  let query = supabase
    .from('company_profiles')
    .select(
      `id, name, slug, sector, city, company_size, website_url,
       description, validation_status, validation_note, created_at, is_featured`,
    )
    .order('created_at', { ascending: false })

  if (status) query = query.eq('validation_status', status)

  const { data: companies = [] } = await query.returns<CompanyRow[]>()

  // ── Table columns ────────────────────────────────────────

  const columns: AdminTableColumn<CompanyRow>[] = [
    {
      key: 'identity',
      header: 'Entreprise',
      cell: (row) => (
        <div className="flex items-start gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-heading text-[13px] font-semibold text-foreground">
                {row.name}
              </p>
              {row.is_featured && (
                <Star
                  className="size-3 fill-current"
                  style={{ color: 'var(--color-warning)' }}
                  aria-label="En vedette"
                />
              )}
            </div>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{row.sector}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Localisation',
      width: 'w-[130px]',
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
      key: 'size',
      header: 'Taille',
      width: 'w-[100px]',
      cell: (row) => (
        <span className="text-[12px] text-muted-foreground">
          {row.company_size ? `${row.company_size} emp.` : '—'}
        </span>
      ),
    },
    {
      key: 'links',
      header: 'Liens',
      width: 'w-[100px]',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.website_url && (
            <a
              href={row.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[12px] transition-colors hover:text-[var(--apebi-cyan)]"
              style={{ color: 'var(--apebi-text-muted)' }}
              aria-label={`Site web de ${row.name}`}
              title="Site web"
            >
              <Globe className="size-3.5" aria-hidden />
            </a>
          )}
          <Link
            href={`/entreprises/${row.slug}`}
            target="_blank"
            className="flex items-center gap-1 text-[12px] transition-colors hover:text-[var(--apebi-cyan)]"
            style={{ color: 'var(--apebi-text-muted)' }}
            aria-label={`Vitrine de ${row.name}`}
            title="Voir la vitrine"
          >
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      width: 'w-[120px]',
      cell: (row) => <AdminStatusBadge status={row.validation_status} feminine />,
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
        title="Entreprises"
        totalCount={countTotal ?? 0}
        description="Gestion des membres APEBI et validation des accès recruteurs"
        filterBaseHref="/admin/entreprises"
        activeFilter={status ?? ''}
        filters={[
          { label: 'Toutes',      value: '',         count: countTotal    ?? 0 },
          { label: 'En attente',  value: 'pending',  count: countPending  ?? 0 },
          { label: 'Validées',    value: 'approved', count: countApproved ?? 0 },
          { label: 'Refusées',    value: 'rejected', count: countRejected ?? 0 },
        ]}
      />

      <AdminTable
        caption="Liste des entreprises APEBI TechTalent"
        columns={columns}
        data={companies ?? []}
        rowKey={(row) => row.id}
        emptyState={
          <EmptyState
            icon={Building2}
            title="Aucune entreprise trouvée"
            description={
              status
                ? `Aucune entreprise avec le statut "${status}" pour l'instant.`
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
                    await validateCompany(row.id, 'approved')
                  }}
                >
                  <AdminTableAction label="Valider" variant="approve" />
                </form>
                <form
                  action={async () => {
                    'use server'
                    await validateCompany(row.id, 'rejected', 'Demande non conforme aux critères APEBI.')
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
                  await validateCompany(row.id, 'pending')
                }}
              >
                <AdminTableAction label="Remettre" variant="reset" />
              </form>
            )}
            {row.validation_status === 'approved' && (
              <>
                <form
                  action={async () => {
                    'use server'
                    await toggleFeatured(row.id, row.is_featured)
                  }}
                >
                  <AdminTableAction
                    label={row.is_featured ? '★ Vedette' : '☆ Mettre en vedette'}
                    variant={row.is_featured ? 'approve' : 'reset'}
                  />
                </form>
                <form
                  action={async () => {
                    'use server'
                    await deactivateCompany(row.id)
                  }}
                >
                  <AdminTableAction label="Désactiver" variant="reject" />
                </form>
              </>
            )}
          </>
        )}
      />

      {/* Notes admin */}
      {(companies ?? []).some((c) => c.validation_note) && (
        <details className="mt-4 rounded-lg border border-[var(--apebi-border)] bg-card">
          <summary className="cursor-pointer px-4 py-3 font-heading text-[12px] font-semibold text-muted-foreground">
            Notes admin ({(companies ?? []).filter((c) => c.validation_note).length})
          </summary>
          <div className="divide-y divide-[var(--apebi-border)]">
            {(companies ?? [])
              .filter((c) => c.validation_note)
              .map((c) => (
                <div key={c.id} className="px-4 py-3">
                  <p className="font-heading text-[12px] font-semibold text-foreground">{c.name}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{c.validation_note}</p>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  )
}
