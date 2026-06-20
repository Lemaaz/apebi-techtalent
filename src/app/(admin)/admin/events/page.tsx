import type { Metadata } from 'next'
import { Calendar, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminTable, AdminTableAction, type AdminTableColumn } from '@/components/admin/admin-table'
import { EmptyState } from '@/components/ui/empty-state'
import { EventCreateForm } from './_event-form'
import { updateEventStatus, deleteEvent } from './actions'

export const metadata: Metadata = { title: 'Événements — Admin' }

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Brouillon', cls: 'badge-contract' },
  published: { label: 'Publié',    cls: 'badge-approved' },
  cancelled: { label: 'Annulé',    cls: 'badge-rejected' },
  past:      { label: 'Passé',     cls: 'badge-contract' },
}

const TYPE_LABELS: Record<string, string> = {
  conference: 'Conférence', workshop: 'Workshop', job_fair: 'Job Fair',
  hackathon: 'Hackathon', networking: 'Networking',
}

type EventRow = {
  id: string
  title: string
  slug: string
  type_event: string | null
  date_debut: string
  lieu: string | null
  status: string
  is_apebi_event: boolean
  places_disponibles: number | null
}

type SearchParams = Promise<{ status?: string; create?: string }>

export default async function AdminEventsPage({ searchParams }: { searchParams: SearchParams }) {
  const { status, create } = await searchParams
  const supabase = await createClient()

  const [
    { count: cDraft }, { count: cPub }, { count: cCancelled }, { count: cTotal },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    supabase.from('events').select('*', { count: 'exact', head: true }),
  ])

  let query = supabase
    .from('events')
    .select('id, title, slug, type_event, date_debut, lieu, status, is_apebi_event, places_disponibles')
    .order('date_debut', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data: events = [] } = await query.returns<EventRow[]>()

  const columns: AdminTableColumn<EventRow>[] = [
    {
      key: 'event',
      header: 'Événement',
      cell: (row) => (
        <div>
          <p className="font-heading text-[13px] font-semibold text-foreground">{row.title}</p>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            {row.type_event && <span>{TYPE_LABELS[row.type_event] ?? row.type_event}</span>}
            {row.is_apebi_event && <span className="text-[var(--apebi-cyan)]">APEBI</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      width: 'w-[140px]',
      cell: (row) => (
        <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
          <Calendar className="size-3 shrink-0" aria-hidden />
          {new Date(row.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'lieu',
      header: 'Lieu',
      width: 'w-[120px]',
      cell: (row) => row.lieu ? (
        <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
          <MapPin className="size-3 shrink-0" aria-hidden />
          {row.lieu}
        </span>
      ) : <span className="text-[12px] text-muted-foreground">—</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      width: 'w-[100px]',
      cell: (row) => {
        const b = STATUS_BADGE[row.status] ?? { label: row.status, cls: 'badge-contract' }
        return <span className={b.cls}>{b.label}</span>
      },
    },
  ]

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Événements"
        totalCount={cTotal ?? 0}
        description="Gérez les événements APEBI visibles sur la plateforme."
        filterBaseHref="/admin/events"
        activeFilter={status ?? ''}
        filters={[
          { label: 'Tous',        value: '',          count: cTotal     ?? 0 },
          { label: 'Publiés',     value: 'published', count: cPub       ?? 0 },
          { label: 'Brouillons',  value: 'draft',     count: cDraft     ?? 0 },
          { label: 'Annulés',     value: 'cancelled', count: cCancelled ?? 0 },
        ]}
      />

      <AdminTable
        caption="Liste des événements APEBI TechTalent"
        columns={columns}
        data={events ?? []}
        rowKey={(row) => row.id}
        emptyState={
          <EmptyState
            icon={Calendar}
            title="Aucun événement"
            description="Créez votre premier événement ci-dessous."
            compact
          />
        }
        actions={(row) => (
          <>
            {row.status === 'draft' && (
              <form action={async () => { 'use server'; await updateEventStatus(row.id, 'published') }}>
                <AdminTableAction label="Publier" variant="approve" />
              </form>
            )}
            {row.status === 'published' && (
              <form action={async () => { 'use server'; await updateEventStatus(row.id, 'cancelled') }}>
                <AdminTableAction label="Annuler" variant="reject" />
              </form>
            )}
            {(row.status === 'cancelled' || row.status === 'draft') && (
              <form action={async () => { 'use server'; await deleteEvent(row.id) }}>
                <AdminTableAction label="Supprimer" variant="reject" />
              </form>
            )}
          </>
        )}
      />

      {/* Formulaire de création */}
      <section>
        <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
          Créer un nouvel événement
        </h2>
        <div className="rounded-xl border border-[var(--apebi-border)] bg-card p-6">
          <EventCreateForm />
        </div>
      </section>
    </div>
  )
}
