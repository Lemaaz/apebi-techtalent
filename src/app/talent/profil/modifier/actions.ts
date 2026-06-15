// src/app/talent/profil/modifier/actions.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ── Update profile info ───────────────────────────────────────

const profileSchema = z.object({
  first_name: z.string().min(1, 'Prénom requis').max(50),
  last_name: z.string().min(1, 'Nom requis').max(50),
  title: z.string().max(100).optional(),
  bio: z.string().max(500, 'Bio max 500 caractères').optional(),
  city: z.string().max(100).optional(),
  years_experience: z.coerce.number().int().min(0).max(50).optional(),
  seniority_level: z
    .enum(['Junior', 'Mid', 'Senior', 'Lead', 'Expert'])
    .optional(),
  availability: z
    .enum(['Immédiate', '1 mois', '3 mois', 'Non disponible'])
    .optional(),
  remote_preference: z.enum(['Full remote', 'Hybride', 'Présentiel']).optional(),
  expected_salary_range: z.string().max(50).optional(),
  linkedin_url: z
    .string()
    .url('URL invalide')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || null),
  github_url: z
    .string()
    .url('URL invalide')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || null),
  portfolio_url: z
    .string()
    .url('URL invalide')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || null),
})

export type UpdateProfileState = { error: string | null; success: boolean }

export async function updateTalentProfile(
  _: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const job_type = formData.getAll('job_type') as string[]

  const parsed = profileSchema.safeParse({
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    title: formData.get('title') || undefined,
    bio: formData.get('bio') || undefined,
    city: formData.get('city') || undefined,
    years_experience: formData.get('years_experience') || undefined,
    seniority_level: formData.get('seniority_level') || undefined,
    availability: formData.get('availability') || undefined,
    remote_preference: formData.get('remote_preference') || undefined,
    expected_salary_range: formData.get('expected_salary_range') || undefined,
    linkedin_url: (formData.get('linkedin_url') as string) ?? '',
    github_url: (formData.get('github_url') as string) ?? '',
    portfolio_url: (formData.get('portfolio_url') as string) ?? '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides', success: false }
  }

  const { error } = await supabase
    .from('talent_profiles')
    .update({ ...parsed.data, job_type: job_type.length > 0 ? job_type : null })
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Erreur lors de la mise à jour', success: false }
  }

  revalidatePath('/talent/profil')
  return { error: null, success: true }
}

// ── Update skills ─────────────────────────────────────────────

export async function updateTalentSkills(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const skill_ids = formData.getAll('skill_ids') as string[]

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!talent) redirect('/talent/inscription')

  // Delete all existing skills then re-insert
  const { error: deleteError } = await supabase.from('talent_skills').delete().eq('talent_id', talent.id)
  if (deleteError) console.error('[updateTalentSkills] delete failed:', deleteError.message)

  if (skill_ids.length > 0) {
    const validIds = skill_ids.filter((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
    )
    if (validIds.length > 0) {
      const { error: insertError } = await supabase
        .from('talent_skills')
        .insert(validIds.map((skill_id) => ({ talent_id: talent.id, skill_id })))
      if (insertError) console.error('[updateTalentSkills] insert failed:', insertError.message)
    }
  }

  revalidatePath('/talent/profil')
  revalidatePath('/talent/profil/modifier')
}

// ── Experience CRUD ───────────────────────────────────────────

const expSchema = z.object({
  company_name: z.string().min(1, 'Entreprise requise').max(100),
  title: z.string().min(1, 'Poste requis').max(100),
  description: z.string().max(500).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (YYYY-MM-DD)'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || null),
  is_current: z.boolean().default(false),
  location: z.string().max(100).optional(),
})

export type ExperienceState = { error: string | null }

export async function addExperience(
  _: ExperienceState,
  formData: FormData,
): Promise<ExperienceState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const is_current = formData.get('is_current') === 'true'

  const parsed = expSchema.safeParse({
    company_name: formData.get('company_name'),
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    start_date: formData.get('start_date'),
    end_date: is_current ? null : (formData.get('end_date') as string) ?? '',
    is_current,
    location: formData.get('location') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!talent) return { error: 'Profil introuvable' }

  const { error } = await supabase
    .from('experiences')
    .insert({ ...parsed.data, talent_id: talent.id })

  if (error) {
    return { error: "Erreur lors de l'ajout de l'expérience" }
  }

  revalidatePath('/talent/profil')
  revalidatePath('/talent/profil/modifier')
  return { error: null }
}

export async function deleteExperience(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const experience_id = formData.get('experience_id') as string
  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!talent) return

  await supabase
    .from('experiences')
    .delete()
    .eq('id', experience_id)
    .eq('talent_id', talent.id) // ownership check

  revalidatePath('/talent/profil')
  revalidatePath('/talent/profil/modifier')
}

// ── Education CRUD ────────────────────────────────────────────

const eduSchema = z.object({
  institution: z.string().min(1, 'Établissement requis').max(100),
  degree: z.string().max(100).optional(),
  field: z.string().max(100).optional(),
  start_year: z.coerce.number().int().min(1950).max(2030).optional(),
  end_year: z.coerce.number().int().min(1950).max(2035).optional(),
})

export type EducationState = { error: string | null }

export async function addEducation(
  _: EducationState,
  formData: FormData,
): Promise<EducationState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const parsed = eduSchema.safeParse({
    institution: formData.get('institution'),
    degree: formData.get('degree') || undefined,
    field: formData.get('field') || undefined,
    start_year: formData.get('start_year') || undefined,
    end_year: formData.get('end_year') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!talent) return { error: 'Profil introuvable' }

  const { error } = await supabase
    .from('educations')
    .insert({ ...parsed.data, talent_id: talent.id })

  if (error) {
    return { error: "Erreur lors de l'ajout de la formation" }
  }

  revalidatePath('/talent/profil')
  revalidatePath('/talent/profil/modifier')
  return { error: null }
}

export async function deleteEducation(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const education_id = formData.get('education_id') as string
  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!talent) return

  await supabase
    .from('educations')
    .delete()
    .eq('id', education_id)
    .eq('talent_id', talent.id) // ownership check

  revalidatePath('/talent/profil')
  revalidatePath('/talent/profil/modifier')
}
