'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const EventSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, 'Slug : lettres minuscules, chiffres et tirets uniquement'),
  description: z.string().max(5000).optional().nullable(),
  type_event: z.enum(['conference', 'workshop', 'job_fair', 'hackathon', 'networking']).optional().nullable(),
  date_debut: z.string().min(1, 'Date de début requise'),
  date_fin: z.string().optional().nullable(),
  lieu: z.string().max(200).optional().nullable(),
  url_inscription_externe: z.string().url('URL invalide').optional().nullable().or(z.literal('')),
  places_disponibles: z.coerce.number().int().min(1).optional().nullable(),
  is_apebi_event: z.coerce.boolean().optional(),
  status: z.enum(['draft', 'published', 'cancelled']).default('draft'),
})

export type EventFormState = { error: string | null; success: boolean }

export async function createEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié', success: false }
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Accès refusé', success: false }

  const raw = {
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') || null,
    type_event: formData.get('type_event') || null,
    date_debut: formData.get('date_debut'),
    date_fin: formData.get('date_fin') || null,
    lieu: formData.get('lieu') || null,
    url_inscription_externe: formData.get('url_inscription_externe') || null,
    places_disponibles: formData.get('places_disponibles') || null,
    is_apebi_event: formData.get('is_apebi_event') === 'true',
    status: formData.get('status') ?? 'draft',
  }

  const parsed = EventSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides', success: false }
  }

  const payload = {
    ...parsed.data,
    url_inscription_externe: parsed.data.url_inscription_externe || null,
    created_by: user.id,
    organisateur_company_id: null,
  }

  const { error } = await supabase.from('events').insert(payload)
  if (error) return { error: error.message, success: false }

  revalidatePath('/admin/events')
  revalidatePath('/events')
  return { error: null, success: true }
}

export async function updateEventStatus(
  eventId: string,
  status: 'published' | 'cancelled' | 'draft',
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) throw new Error('Accès refusé')

  await supabase.from('events').update({ status }).eq('id', eventId)
  revalidatePath('/admin/events')
  revalidatePath('/events')
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) throw new Error('Accès refusé')

  await supabase.from('events').delete().eq('id', eventId)
  revalidatePath('/admin/events')
  revalidatePath('/events')
}
