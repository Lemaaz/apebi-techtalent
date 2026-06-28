'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEventConfirmationEmail } from '@/lib/email'

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
    .select('id, title, places_disponibles, status, date_debut, lieu, url_inscription_externe')
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

  // NOT-EVT — email de confirmation (non-bloquant)
  try {
    const admin = createAdminClient()
    const { data: authUser } = await admin.auth.admin.getUserById(user.id)
    if (authUser.user?.email && event) {
      const { data: profile } = await supabase
        .from('talent_profiles')
        .select('first_name')
        .eq('user_id', user.id)
        .maybeSingle()
      const ev = event as { title?: string; lieu?: string | null; url_inscription_externe?: string | null; date_debut: string }
      await sendEventConfirmationEmail({
        toEmail: authUser.user.email,
        firstName: profile?.first_name ?? 'Membre APEBI',
        eventTitle: ev.title ?? 'Événement APEBI',
        dateDebut: ev.date_debut,
        lieu: ev.lieu ?? null,
        urlExterne: ev.url_inscription_externe ?? null,
      })
    }
  } catch (emailErr) {
    console.error('[registerForEvent] email error (non-blocking):', emailErr)
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
