import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, MapPin, Users, ExternalLink, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { RegisterButton } from './_register-button'

type Params = Promise<{ slug: string }>

type EventDetail = {
  id: string
  title: string
  slug: string
  description: string | null
  type_event: string | null
  date_debut: string
  date_fin: string | null
  lieu: string | null
  url_inscription_externe: string | null
  places_disponibles: number | null
  is_apebi_event: boolean
  status: string
  company_profiles: { name: string; slug: string } | null
}

const TYPE_LABELS: Record<string, string> = {
  conference: 'Conférence',
  workshop: 'Workshop',
  job_fair: 'Job Fair',
  hackathon: 'Hackathon',
  networking: 'Networking',
}

const fetchEvent = cache(async function fetchEvent(slug: string): Promise<EventDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select(
      `id, title, slug, description, type_event, date_debut, date_fin, lieu,
       url_inscription_externe, places_disponibles, is_apebi_event, status,
       company_profiles:organisateur_company_id ( name, slug )`,
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle<EventDetail>()

  if (error) {
    console.error('[events/slug] Supabase error:', error.message)
    return null
  }
  return data
})

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const event = await fetchEvent(slug)
  if (!event) return { title: 'Événement non trouvé' }
  return {
    title: `${event.title} `,
    description: event.description?.slice(0, 160) ?? undefined,
  }
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function EventDetailPage({ params }: { params: Params }) {
  const { slug } = await params
  const event = await fetchEvent(slug)
  if (!event) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Inscriptions : total + état de l'utilisateur
  const [{ count: registeredCount }, ownReg] = await Promise.all([
    supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'registered'),
    user
      ? supabase
          .from('event_registrations')
          .select('id')
          .eq('event_id', event.id)
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const isRegistered = !!ownReg.data
  const isPast = new Date(event.date_debut) < new Date()
  const isFull =
    event.places_disponibles != null && (registeredCount ?? 0) >= event.places_disponibles
  const placesLeft =
    event.places_disponibles != null
      ? Math.max(0, event.places_disponibles - (registeredCount ?? 0))
      : null

  const organiser = event.is_apebi_event ? 'APEBI · Commission C5' : event.company_profiles?.name

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/events"
            className="mb-6 inline-flex items-center gap-1 text-xs text-white/45 hover:text-white"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Tous les événements
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {event.type_event && (
              <span className="rounded-full bg-[#00AFD2]/10 px-3 py-1 text-xs font-medium text-[#00AFD2]">
                {TYPE_LABELS[event.type_event] ?? event.type_event}
              </span>
            )}
            {event.is_apebi_event && (
              <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-white/55">APEBI</span>
            )}
            {isPast && (
              <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-white/45">Passé</span>
            )}
          </div>

          <h1 className="mt-3 font-heading text-2xl font-bold text-white sm:text-3xl">
            {event.title}
          </h1>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* Contenu */}
            <div className="space-y-6 min-w-0">
              <dl className="space-y-3 rounded-xl border border-white/8 bg-[#141414] p-5 text-sm">
                <div className="flex items-center gap-2.5 text-white/70">
                  <Calendar className="size-4 shrink-0 text-[#00AFD2]" aria-hidden />
                  {formatDateTime(event.date_debut)}
                </div>
                {event.date_fin && (
                  <div className="flex items-center gap-2.5 text-white/55">
                    <Clock className="size-4 shrink-0 text-white/40" aria-hidden />
                    Jusqu&apos;au {formatDateTime(event.date_fin)}
                  </div>
                )}
                {event.lieu && (
                  <div className="flex items-center gap-2.5 text-white/70">
                    <MapPin className="size-4 shrink-0 text-[#00AFD2]" aria-hidden />
                    {event.lieu}
                  </div>
                )}
                {organiser && (
                  <div className="flex items-center gap-2.5 text-white/70">
                    <Building2 className="size-4 shrink-0 text-white/40" aria-hidden />
                    {event.company_profiles?.slug ? (
                      <Link href={`/entreprises/${event.company_profiles.slug}`} className="hover:text-[#00AFD2]">
                        {organiser}
                      </Link>
                    ) : (
                      organiser
                    )}
                  </div>
                )}
              </dl>

              {event.description && (
                <section>
                  <h2 className="mb-2 font-heading text-base font-semibold text-white">À propos</h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/55">
                    {event.description}
                  </p>
                </section>
              )}
            </div>

            {/* Inscription */}
            <aside>
              <div className="rounded-xl border border-white/8 bg-[#141414] p-5">
                <p className="mb-3 font-heading text-sm font-semibold text-white">Inscription</p>

                {placesLeft != null && !isPast && (
                  <p className="mb-3 flex items-center gap-1.5 text-xs text-white/50">
                    <Users className="size-3.5" aria-hidden />
                    {placesLeft > 0 ? `${placesLeft} place${placesLeft > 1 ? 's' : ''} restante${placesLeft > 1 ? 's' : ''}` : 'Complet'}
                  </p>
                )}

                {event.url_inscription_externe ? (
                  <a
                    href={event.url_inscription_externe}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00AFD2] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00AFD2]/90"
                  >
                    <ExternalLink className="size-4" aria-hidden />
                    S&apos;inscrire (lien externe)
                  </a>
                ) : (
                  <RegisterButton
                    eventId={event.id}
                    slug={event.slug}
                    isAuthenticated={!!user}
                    isRegistered={isRegistered}
                    isFull={isFull}
                    isPast={isPast}
                  />
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
