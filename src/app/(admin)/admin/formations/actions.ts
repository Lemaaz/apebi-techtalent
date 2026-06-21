'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(3, 'Titre requis (3 car. min)').max(160),
  description: z.string().max(1000).optional(),
  institution_id: z.string().uuid().optional().or(z.literal('')),
  domain_id: z.string().uuid().optional().or(z.literal('')),
  level: z.enum(['Débutant', 'Intermédiaire', 'Avancé', 'Tous niveaux']).default('Tous niveaux'),
  modality: z.enum(['Présentiel', 'Online', 'Hybride']).default('Présentiel'),
  duration_text: z.string().max(60).optional(),
  price_range: z.string().max(80).optional(),
  url_inscription: z.string().url('URL invalide').optional().or(z.literal('')),
  is_featured: z.boolean().default(false),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
})

export type FormationState = { error: string | null }

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')
  return supabase
}

export async function createFormation(
  _: FormationState,
  formData: FormData,
): Promise<FormationState> {
  const supabase = await requireAdmin()

  const parsed = schema.safeParse({
    title: formData.get('title'),
    description: (formData.get('description') as string) || undefined,
    institution_id: (formData.get('institution_id') as string) || undefined,
    domain_id: (formData.get('domain_id') as string) || undefined,
    level: formData.get('level') ?? 'Tous niveaux',
    modality: formData.get('modality') ?? 'Présentiel',
    duration_text: (formData.get('duration_text') as string) || undefined,
    price_range: (formData.get('price_range') as string) || undefined,
    url_inscription: (formData.get('url_inscription') as string) || undefined,
    is_featured: formData.get('is_featured') === 'true',
    status: formData.get('status') ?? 'active',
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const d = parsed.data
  const slug = `${slugify(d.title)}-${Date.now().toString(36)}`

  const { error } = await supabase.from('training_programs').insert({
    title: d.title,
    slug,
    description: d.description ?? null,
    institution_id: d.institution_id || null,
    domain_id: d.domain_id || null,
    level: d.level,
    modality: d.modality,
    duration_text: d.duration_text ?? null,
    price_range: d.price_range ?? null,
    url_inscription: d.url_inscription || null,
    is_featured: d.is_featured,
    status: d.status,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/formations')
  revalidatePath('/formation')
  redirect('/admin/formations')
}

export async function deleteFormation(formData: FormData) {
  const supabase = await requireAdmin()
  const id = formData.get('id') as string
  await supabase.from('training_programs').delete().eq('id', id)
  revalidatePath('/admin/formations')
  revalidatePath('/formation')
}

export async function updateFormation(
  _: FormationState,
  formData: FormData,
): Promise<FormationState> {
  const supabase = await requireAdmin()
  const id = formData.get('id') as string
  if (!id) return { error: 'ID manquant.' }

  const parsed = schema.safeParse({
    title: formData.get('title'),
    description: (formData.get('description') as string) || undefined,
    institution_id: (formData.get('institution_id') as string) || undefined,
    domain_id: (formData.get('domain_id') as string) || undefined,
    level: formData.get('level') ?? 'Tous niveaux',
    modality: formData.get('modality') ?? 'Présentiel',
    duration_text: (formData.get('duration_text') as string) || undefined,
    price_range: (formData.get('price_range') as string) || undefined,
    url_inscription: (formData.get('url_inscription') as string) || undefined,
    is_featured: formData.get('is_featured') === 'true',
    status: formData.get('status') ?? 'active',
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const d = parsed.data
  const { error } = await supabase.from('training_programs').update({
    title: d.title,
    description: d.description ?? null,
    institution_id: d.institution_id || null,
    domain_id: d.domain_id || null,
    level: d.level,
    modality: d.modality,
    duration_text: d.duration_text ?? null,
    price_range: d.price_range ?? null,
    url_inscription: d.url_inscription || null,
    is_featured: d.is_featured,
    status: d.status,
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/formations')
  revalidatePath('/formation')
  redirect('/admin/formations')
}

export async function toggleFeatured(formData: FormData) {
  const supabase = await requireAdmin()
  const id = formData.get('id') as string
  const current = formData.get('current') === 'true'
  await supabase.from('training_programs').update({ is_featured: !current }).eq('id', id)
  revalidatePath('/admin/formations')
  revalidatePath('/formation')
}
