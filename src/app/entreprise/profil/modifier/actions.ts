'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { TablesUpdate } from '@/types/database'

const schema = z.object({
  logo_url: z.string().url().optional().or(z.literal('')),
  banner_url: z.string().url().optional().or(z.literal('')),
  description: z.string().max(1000).optional(),
  culture: z.string().max(1000).optional(),
  website_url: z.string().url('URL invalide').optional().or(z.literal('')),
  linkedin_url: z.string().url('URL invalide').optional().or(z.literal('')),
  sector: z.string().max(80).optional(),
  company_size: z
    .enum(['1-10', '11-50', '51-200', '201-500', '500+'])
    .optional()
    .or(z.literal('')),
  city: z.string().max(80).optional(),
  country: z.string().max(60).optional(),
})

export type UpdateProfileState = { error: string | null; success?: boolean }

export async function updateCompanyProfile(
  _: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: member } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return { error: "Compte non associé à une entreprise." }

  const raw = {
    logo_url: (formData.get('logo_url') as string) || undefined,
    banner_url: (formData.get('banner_url') as string) || undefined,
    description: (formData.get('description') as string) || undefined,
    culture: (formData.get('culture') as string) || undefined,
    website_url: (formData.get('website_url') as string) || undefined,
    linkedin_url: (formData.get('linkedin_url') as string) || undefined,
    sector: (formData.get('sector') as string) || undefined,
    company_size: (formData.get('company_size') as string) || undefined,
    city: (formData.get('city') as string) || undefined,
    country: (formData.get('country') as string) || undefined,
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const d = parsed.data
  const payload: TablesUpdate<'company_profiles'> = { updated_at: new Date().toISOString() }

  if (d.logo_url !== undefined) payload.logo_url = d.logo_url || null
  if (d.banner_url !== undefined) payload.banner_url = d.banner_url || null
  if (d.description !== undefined) payload.description = d.description || null
  if (d.culture !== undefined) payload.culture = d.culture || null
  if (d.website_url !== undefined) payload.website_url = d.website_url || null
  if (d.linkedin_url !== undefined) payload.linkedin_url = d.linkedin_url || null
  if (d.sector !== undefined) payload.sector = d.sector
  if (d.company_size !== undefined) payload.company_size = d.company_size || null
  if (d.city !== undefined) payload.city = d.city || null
  if (d.country !== undefined) payload.country = d.country || 'Maroc'

  const { error } = await supabase
    .from('company_profiles')
    .update(payload)
    .eq('id', member.company_id)

  if (error) {
    console.error('[profil/modifier] update error:', error.message)
    return { error: "Erreur lors de la mise à jour. Réessayez." }
  }

  revalidatePath('/entreprise/dashboard')
  revalidatePath('/entreprises')

  return { error: null, success: true }
}
