'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ── Inscription à un événement ──
// Vérifie auth + capacité (places_disponibles) + déduplique via
// UNIQUE(event_id, user_id). Retourne un résultat (pas d'exception)
// pour afficher des messages fiables côté client, y compris en prod.

export type RegisterResult = { ok: boolean; error?: string }

export async function registerForEvent(eventId: string, slug: string): Promise<RegisterResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Connectez-vous pour vous inscrire.' }

  const { data: event } = await supabase
    .from('events')
    .select('id, places_disponibles, status, date_debut')
    .eq('id', eventId)
    .maybeSingle<{ id: string; places_disponibles: number | null; status: string; date_debut: string }>()

  if (!event || event.status !== 'published') return { ok: false, error: 'Événement indisponible.' }
  if (new Date(event.date_debut) < new Date()) return { ok: false, error: 'Cet événement est passé.' }

  if (event.places_disponibles != null) {
    const { count } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'registered')
    if ((count ?? 0) >= event.places_disponibles) {
      return { ok: false, error: 'Événement complet.' }
    }
  }

  const { error } = await supabase.from('event_registrations').insert({
    event_id: eventId,
    user_id: user.id,
    status: 'registered',
  })

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Vous êtes déjà inscrit à cet événement.' }
    return { ok: false, error: error.message }
  }

  revalidatePath(`/events/${slug}`)
  return { ok: true }
}

export async function cancelRegistration(eventId: string, slug: string): Promise<RegisterResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non authentifié' }

  const { error } = await supabase
    .from('event_registrations')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/events/${slug}`)
  return { ok: true }
}
