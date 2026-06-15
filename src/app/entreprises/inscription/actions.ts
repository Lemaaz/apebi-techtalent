'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  name: z.string().min(2, 'Nom requis (2 caractères min)').max(100),
  sector: z.string().min(1, 'Secteur requis').max(80),
  city: z.string().max(80).optional(),
  website_url: z
    .string()
    .url('URL invalide')
    .transform((v) => v.replace(/\/+$/, ''))
    .optional()
    .or(z.literal('')),
  linkedin_url: z
    .string()
    .url('URL LinkedIn invalide')
    .optional()
    .or(z.literal('')),
  description: z.string().max(1000).optional(),
  company_size: z.string().optional(),
  apebi_member_since: z
    .string()
    .regex(/^\d{4}$/, 'Année sur 4 chiffres')
    .optional()
    .or(z.literal('')),
  contact_full_name: z.string().min(2, 'Nom du contact requis').max(100),
  contact_role: z.string().max(80).optional(),
})

export type CreateCompanyState = { error: string | null }

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

export async function createCompanyProfile(
  _: CreateCompanyState,
  formData: FormData,
): Promise<CreateCompanyState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const parsed = schema.safeParse({
    name: formData.get('name'),
    sector: formData.get('sector'),
    city: (formData.get('city') as string) || undefined,
    website_url: (formData.get('website_url') as string) || undefined,
    linkedin_url: (formData.get('linkedin_url') as string) || undefined,
    description: (formData.get('description') as string) || undefined,
    company_size: (formData.get('company_size') as string) || undefined,
    apebi_member_since: (formData.get('apebi_member_since') as string) || undefined,
    contact_full_name: formData.get('contact_full_name'),
    contact_role: (formData.get('contact_role') as string) || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const d = parsed.data

  // Check already registered
  const { data: existing } = await supabase
    .from('company_members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return { error: 'Votre compte est déjà associé à une entreprise.' }
  }

  // Generate unique slug
  const baseSlug = slugify(d.name)
  const { data: existingSlug } = await supabase
    .from('company_profiles')
    .select('slug')
    .eq('slug', baseSlug)
    .maybeSingle()

  const slug = existingSlug ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug

  // Create company_profile
  // NOTE: apebi_member_since is string | null in DB schema
  const { data: company, error: companyError } = await supabase
    .from('company_profiles')
    .insert({
      name: d.name,
      slug,
      sector: d.sector,
      city: d.city,
      website_url: d.website_url || null,
      linkedin_url: d.linkedin_url || null,
      description: d.description,
      company_size: d.company_size,
      apebi_member_since: d.apebi_member_since || null,
      validation_status: 'pending',
    })
    .select('id')
    .single()

  if (companyError || !company) {
    return { error: "Erreur lors de la création de l'entreprise. Réessayez." }
  }

  // Create company_member for the registrant
  const { error: memberError } = await supabase.from('company_members').insert({
    company_id: company.id,
    user_id: user.id,
    role_in_company: d.contact_role ?? 'Recruteur',
    full_name: d.contact_full_name,
  })

  if (memberError) {
    // Rollback company
    await supabase.from('company_profiles').delete().eq('id', company.id)
    return { error: "Erreur lors de la création du compte recruteur. Réessayez." }
  }

  redirect('/entreprise/dashboard?inscription=success')
}
