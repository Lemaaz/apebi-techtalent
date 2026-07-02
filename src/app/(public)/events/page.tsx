import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, MapPin, Users, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { PublicPageHeader } from '@/components/layout/public-page-header'
import { Footer } from '@/components/layout/footer'
import { EmptyState } from '@/components/ui/empty-state'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Événements',
  description:
    "Conférences, workshops, job fairs et rencontres de l'écosystème tech APEBI au Maroc.",
}

type EventRow = {
  id: string
  title: string
  slug: string
  description: string | null
  type_event: string | null
  date_debut: string
  date_fin: string | null
  lieu: string | null
  image_url: string | null
  is_apebi_event: boolean
  company_profiles: { name: string } | null
}

const TYPE_LABELS: Record<string, string> = {
  conference: 'Conférence',
  workshop: 'Workshop',
  job_fair: 'Job Fair',
  hackathon: 'Hackathon',
  networking: 'Networking',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function EventsPage() {
  const supabase = await createClient()
  const nowIso = new Date().toISOString()

  const { data: upcoming = [] } = await supabase
    .from('events')
    .select(
      `id, title, slug, description, type_event, date_debut, date_fin, lieu,
       image_url, is_apebi_event, company_profiles:organisateur_company_id ( name )`,
    )
    .eq('status', 'published')
    .gte('date_debut', nowIso)
    .order('date_debut', { ascending: true })
    .returns<EventRow[]>()

  const { data: past = [] } = await supabase
    .from('events')
    .select(
      `id, title, slug, description, type_event, date_debut, date_fin, lieu,
       image_url, is_apebi_event, company_profiles:organisateur_company_id ( name )`,
    )
    .eq('status', 'published')
    .lt('date_debut', nowIso)
    .order('date_debut', { ascending: false })
    .limit(6)
    .returns<EventRow[]>()

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1">
        <PublicPageHeader
          title="Événements"
          subtitle="Conférences, workshops et rencontres de l'écosystème tech APEBI."
          width="5xl"
        />

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {(upcoming ?? []).length === 0 && (past ?? []).length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Aucun événement pour le moment"
              description="Les prochains événements de la Commission C5 apparaîtront ici."
            />
          ) : (
            <>
              {(upcoming ?? []).length > 0 && (
                <section aria-labelledby="upcoming-h">
                  <h2 id="upcoming-h" className="mb-4 font-heading text-sm font-semibold uppercase tracking-wide text-white/45">
                    À venir
                  </h2>
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
                    {(upcoming ?? []).map((e) => (
                      <li key={e.id}>
                        <EventCard event={e} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {(past ?? []).length > 0 && (
                <section aria-labelledby="past-h" className="mt-12">
                  <h2 id="past-h" className="mb-4 font-heading text-sm font-semibold uppercase tracking-wide text-white/45">
                    Passés
                  </h2>
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
                    {(past ?? []).map((e) => (
                      <li key={e.id}>
                        <EventCard event={e} past />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

function EventCard({ event, past = false }: { event: EventRow; past?: boolean }) {
  const organiser = event.is_apebi_event ? 'APEBI · Commission C5' : event.company_profiles?.name
  return (
    <Link
      href={`/events/${event.slug}`}
      className={`block h-full rounded-xl border border-white/8 bg-[var(--apebi-dark-85)] p-5 transition-colors hover:border-[var(--apebi-cyan)]/30 ${past ? 'opacity-70' : ''}`}
    >
      <div className="flex items-center gap-2">
        {event.type_event && (
          <span className="rounded-full bg-[var(--apebi-cyan)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--apebi-cyan)]">
            {TYPE_LABELS[event.type_event] ?? event.type_event}
          </span>
        )}
        {event.is_apebi_event && (
          <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-[11px] text-white/55">APEBI</span>
        )}
      </div>

      <h3 className="mt-3 font-heading text-base font-semibold text-white">{event.title}</h3>

      <div className="mt-3 space-y-1.5 text-xs text-white/55">
        <p className="flex items-center gap-1.5">
          <Calendar className="size-3.5 shrink-0" aria-hidden />
          {formatDate(event.date_debut)}
        </p>
        {event.lieu && (
          <p className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            {event.lieu}
          </p>
        )}
        {organiser && (
          <p className="flex items-center gap-1.5">
            <Users className="size-3.5 shrink-0" aria-hidden />
            {organiser}
          </p>
        )}
      </div>
    </Link>
  )
}
