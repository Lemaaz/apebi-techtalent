'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'
import { sendProfileSubmittedEmail, sendAdminNewProfileEmail } from '@/lib/email'

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

  // Atomic creation via RPC (fixes race condition — company + member in one transaction)
  const { error: rpcError } = await supabase.rpc('create_company_with_member', {
    p_name: d.name,
    p_slug: slug,
    p_sector: d.sector,
    p_city: d.city ?? undefined,
    p_website_url: d.website_url || undefined,
    p_linkedin_url: d.linkedin_url || undefined,
    p_description: d.description ?? undefined,
    p_company_size: d.company_size ?? undefined,
    p_apebi_member_since: d.apebi_member_since ?? undefined,
    p_contact_full_name: d.contact_full_name,
    p_contact_role: d.contact_role ?? undefined,
  })

  if (rpcError) {
    if (rpcError.message.includes('already_member')) {
      return { error: 'Votre compte est déjà associé à une entreprise.' }
    }
    return { error: "Erreur lors de la création de l'entreprise. Réessayez." }
  }

  // NOT-00 — confirmation à l'entreprise + alerte admin (non-bloquant)
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://techtalent-apebi.vercel.app'
    await Promise.all([
      sendProfileSubmittedEmail({
        toEmail: user.email!,
        firstName: d.contact_full_name,
        role: 'entreprise',
      }),
      sendAdminNewProfileEmail({
        role: 'entreprise',
        name: d.name,
        adminReviewUrl: `${appUrl}/admin/entreprises`,
      }),
    ])
  } catch (emailErr) {
    console.error('[createCompanyProfile] email error (non-blocking):', emailErr)
  }

  redirect('/entreprise/dashboard?inscription=success')
}
