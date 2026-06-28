'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sendProfileSubmittedEmail, sendAdminNewProfileEmail } from '@/lib/email'
import { logFunnel } from '@/lib/funnel'

const schema = z.object({
  first_name: z.string().min(1, 'Prénom requis').max(50),
  last_name: z.string().min(1, 'Nom requis').max(50),
  title: z.string().max(100).optional(),
  bio: z.string().max(500, 'Bio max 500 caractères').optional(),
  city: z.string().max(100).optional(),
  availability: z.enum(['Immédiate', '1 mois', '3 mois', 'Non disponible']).optional(),
  remote_preference: z.enum(['Full remote', 'Hybride', 'Présentiel']).optional(),
  expected_salary_range: z.string().max(50).optional(),
  linkedin_url: z
    .string()
    .url('URL LinkedIn invalide')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  github_url: z
    .string()
    .url('URL GitHub invalide')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  portfolio_url: z
    .string()
    .url('URL Portfolio invalide')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
})

export type CreateProfileState = { error: string | null }

export async function createTalentProfile(
  _: CreateProfileState,
  formData: FormData,
): Promise<CreateProfileState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const rawSkillIds = formData.getAll('skill_ids') as string[]
  const job_type = formData.getAll('job_type') as string[]

  // Validate skill_ids to only allow valid UUIDs
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const skill_ids = rawSkillIds.filter((id) => UUID_RE.test(id))

  const parsed = schema.safeParse({
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    title: formData.get('title') || undefined,
    bio: formData.get('bio') || undefined,
    city: formData.get('city') || undefined,
    availability: formData.get('availability') || undefined,
    remote_preference: formData.get('remote_preference') || undefined,
    expected_salary_range: formData.get('expected_salary_range') || undefined,
    linkedin_url: (formData.get('linkedin_url') as string) ?? '',
    github_url: (formData.get('github_url') as string) ?? '',
    portfolio_url: (formData.get('portfolio_url') as string) ?? '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('talent_profiles')
    .insert({
      ...parsed.data,
      user_id: user.id,
      country: 'Maroc',
      job_type: job_type.length > 0 ? job_type : null,
    })
    .select('id')
    .single()

  if (profileError) {
    if (profileError.code === '23505') return { error: 'Un profil existe déjà pour ce compte' }
    console.error('[createTalentProfile]', profileError.message)
    return { error: 'Erreur lors de la création du profil' }
  }

  if (skill_ids.length > 0) {
    const { error: skillError } = await supabase
      .from('talent_skills')
      .insert(skill_ids.map((skill_id) => ({ talent_id: profile.id, skill_id })))

    if (skillError) {
      console.error('[createTalentProfile] skill insert failed:', skillError.message)
      return {
        error:
          "Profil créé, mais erreur lors de l'enregistrement des compétences. Ajoutez-les depuis votre profil.",
      }
    }
  }

  // FUNNEL — inscription
  logFunnel('inscription', { talentId: profile.id, userId: user.id })

  // NOT-00 — confirmation au talent + alerte admin (non-bloquant)
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://techtalent-apebi.vercel.app'
    await Promise.all([
      sendProfileSubmittedEmail({
        toEmail: user.email!,
        firstName: parsed.data.first_name,
        role: 'talent',
      }),
      sendAdminNewProfileEmail({
        role: 'talent',
        name: `${parsed.data.first_name} ${parsed.data.last_name}`,
        adminReviewUrl: `${appUrl}/admin/talents`,
      }),
    ])
  } catch (emailErr) {
    console.error('[createTalentProfile] email error (non-blocking):', emailErr)
  }

  redirect('/talent/profil')
}
