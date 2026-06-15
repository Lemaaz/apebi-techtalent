'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  title: z.string().min(3, 'Titre requis (3 car. min)').max(120),
  description: z.string().min(50, 'Description requise (50 car. min)').max(5000),
  contract_type: z.enum(['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance']),
  seniority_level: z.enum(['Junior', 'Mid', 'Senior', 'Lead']).optional(),
  city: z.string().max(80).optional(),
  remote_policy: z.enum(['Full remote', 'Hybride', 'Présentiel']).optional(),
  salary_range: z.string().max(60).optional(),
  closes_at: z.string().optional(),
  skill_ids: z.array(z.string().uuid()).optional(),
  required_skill_ids: z.array(z.string().uuid()).optional(),
  publish_now: z.boolean().default(false),
})

export type CreateJobState = { error: string | null }

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

export async function createJobPosting(
  _: CreateJobState,
  formData: FormData,
): Promise<CreateJobState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  // Verify user is a recruiter
  const { data: member } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    return { error: "Votre compte n'est pas associé à une entreprise." }
  }

  const publishNow = formData.get('publish_now') === 'true'
  const skillIds = formData.getAll('skill_ids') as string[]
  const requiredSkillIds = new Set(formData.getAll('required_skill_ids') as string[])

  const parsed = schema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    contract_type: formData.get('contract_type'),
    seniority_level: (formData.get('seniority_level') as string) || undefined,
    city: (formData.get('city') as string) || undefined,
    remote_policy: (formData.get('remote_policy') as string) || undefined,
    salary_range: (formData.get('salary_range') as string) || undefined,
    closes_at: (formData.get('closes_at') as string) || undefined,
    skill_ids: skillIds.length > 0 ? skillIds : undefined,
    required_skill_ids: requiredSkillIds.size > 0 ? [...requiredSkillIds] : undefined,
    publish_now: publishNow,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const d = parsed.data

  // Generate unique slug
  const baseSlug = `${slugify(d.title)}-${Date.now().toString(36)}`

  const now = new Date().toISOString()
  const { data: job, error: jobError } = await supabase
    .from('job_postings')
    .insert({
      company_id: member.company_id,
      created_by: user.id,
      title: d.title,
      slug: baseSlug,
      description: d.description,
      contract_type: d.contract_type,
      seniority_level: d.seniority_level ?? null,
      city: d.city ?? null,
      remote_policy: d.remote_policy ?? null,
      salary_range: d.salary_range ?? null,
      closes_at: d.closes_at ? new Date(d.closes_at).toISOString() : null,
      status: d.publish_now ? 'active' : 'draft',
      published_at: d.publish_now ? now : null,
    })
    .select('id, slug')
    .single()

  if (jobError || !job) {
    return { error: "Erreur lors de la création de l'offre. Réessayez." }
  }

  // Insert skills
  if (d.skill_ids && d.skill_ids.length > 0) {
    await supabase.from('job_skills').insert(
      d.skill_ids.map((skillId) => ({
        job_id: job.id,
        skill_id: skillId,
        is_required: requiredSkillIds.has(skillId),
      })),
    )
  }

  revalidatePath('/entreprise/offres')
  revalidatePath('/offres')

  redirect('/entreprise/offres')
}
