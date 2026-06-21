'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Nom requis (2 car. min)').max(120),
  type: z.enum(['ecole', 'bootcamp', 'universite', 'certification', 'autre']).default('autre'),
  description: z.string().max(1000).optional(),
  website_url: z.string().url('URL invalide').optional().or(z.literal('')),
  city: z.string().max(80).optional(),
  is_apebi_partner: z.boolean().default(false),
  status: z.enum(['active', 'draft']).default('active'),
})

export type InstitutionState = { error: string | null }

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')
  return supabase
}

export async function createInstitution(
  _: InstitutionState,
  formData: FormData,
): Promise<InstitutionState> {
  const supabase = await requireAdmin()

  const parsed = schema.safeParse({
    name: formData.get('name'),
    type: formData.get('type') ?? 'autre',
    description: (formData.get('description') as string) || undefined,
    website_url: (formData.get('website_url') as string) || undefined,
    city: (formData.get('city') as string) || undefined,
    is_apebi_partner: formData.get('is_apebi_partner') === 'true',
    status: formData.get('status') ?? 'active',
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const d = parsed.data
  const slug = `${slugify(d.name)}-${Date.now().toString(36)}`

  const { error } = await supabase.from('training_institutions').insert({
    name: d.name,
    slug,
    type: d.type,
    description: d.description ?? null,
    website_url: d.website_url || null,
    city: d.city ?? null,
    is_apebi_partner: d.is_apebi_partner,
    status: d.status,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/institutions')
  revalidatePath('/formation')
  redirect('/admin/institutions')
}

export async function updateInstitution(
  _: InstitutionState,
  formData: FormData,
): Promise<InstitutionState> {
  const supabase = await requireAdmin()
  const id = formData.get('id') as string
  if (!id) return { error: 'ID manquant.' }

  const parsed = schema.safeParse({
    name: formData.get('name'),
    type: formData.get('type') ?? 'autre',
    description: (formData.get('description') as string) || undefined,
    website_url: (formData.get('website_url') as string) || undefined,
    city: (formData.get('city') as string) || undefined,
    is_apebi_partner: formData.get('is_apebi_partner') === 'true',
    status: formData.get('status') ?? 'active',
  })

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const d = parsed.data
  const { error } = await supabase.from('training_institutions').update({
    name: d.name,
    type: d.type,
    description: d.description ?? null,
    website_url: d.website_url || null,
    city: d.city ?? null,
    is_apebi_partner: d.is_apebi_partner,
    status: d.status,
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/institutions')
  revalidatePath('/formation')
  redirect('/admin/institutions')
}

export async function deleteInstitution(formData: FormData) {
  const supabase = await requireAdmin()
  const id = formData.get('id') as string
  await supabase.from('training_institutions').delete().eq('id', id)
  revalidatePath('/admin/institutions')
  revalidatePath('/formation')
}

export async function togglePartner(formData: FormData) {
  const supabase = await requireAdmin()
  const id = formData.get('id') as string
  const current = formData.get('current') === 'true'
  await supabase.from('training_institutions').update({ is_apebi_partner: !current }).eq('id', id)
  revalidatePath('/admin/institutions')
  revalidatePath('/formation')
}
