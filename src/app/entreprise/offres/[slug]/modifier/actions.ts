'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const updateSchema = z.object({
  job_id: z.string().uuid(),
  title: z.string().min(3).max(120),
  description: z.string().min(50).max(5000),
  contract_type: z.enum(['CDI', 'CDD', 'Freelance', 'Consulting', 'Stage', 'Alternance']),
  seniority_level: z.enum(['Junior', 'Mid', 'Senior', 'Lead']).optional(),
  city: z.string().max(80).optional(),
  remote_policy: z.enum(['Full remote', 'Hybride', 'Présentiel']).optional(),
  salary_range: z.string().max(60).optional(),
  mission_duration: z.string().max(80).optional(),
  closes_at: z.string().optional(),
})

export type UpdateJobState = { error: string | null }

async function verifyOwnership(jobId: string, userId: string) {
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!member) return { supabase, authorized: false, status: undefined }

  const { data: job } = await supabase
    .from('job_postings')
    .select('id, status')
    .eq('id', jobId)
    .eq('company_id', member.company_id)
    .maybeSingle()

  return { supabase, authorized: !!job, status: job?.status }
}

export async function updateJobPosting(
  _: UpdateJobState,
  formData: FormData,
): Promise<UpdateJobState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const jobId = formData.get('job_id') as string
  const { authorized } = await verifyOwnership(jobId, user.id)
  if (!authorized) return { error: 'Non autorisé.' }

  const skillIds = formData.getAll('skill_ids') as string[]
  const requiredSkillIds = new Set(formData.getAll('required_skill_ids') as string[])

  const parsed = updateSchema.safeParse({
    job_id: jobId,
    title: formData.get('title'),
    description: formData.get('description'),
    contract_type: formData.get('contract_type'),
    seniority_level: (formData.get('seniority_level') as string) || undefined,
    city: (formData.get('city') as string) || undefined,
    remote_policy: (formData.get('remote_policy') as string) || undefined,
    salary_range: (formData.get('salary_range') as string) || undefined,
    mission_duration: (formData.get('mission_duration') as string) || undefined,
    closes_at: (formData.get('closes_at') as string) || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const d = parsed.data

  const { error: updateError } = await supabase
    .from('job_postings')
    .update({
      title: d.title,
      description: d.description,
      contract_type: d.contract_type,
      seniority_level: d.seniority_level ?? null,
      city: d.city ?? null,
      remote_policy: d.remote_policy ?? null,
      salary_range: d.salary_range ?? null,
      mission_duration: d.mission_duration ?? null,
      closes_at: d.closes_at ? new Date(d.closes_at).toISOString() : null,
    })
    .eq('id', jobId)

  if (updateError) return { error: "Erreur lors de la mise à jour. Réessayez." }

  // Replace skills (delete-all then re-insert)
  await supabase.from('job_skills').delete().eq('job_id', jobId)
  if (skillIds.length > 0) {
    await supabase.from('job_skills').insert(
      skillIds.map((skillId) => ({
        job_id: jobId,
        skill_id: skillId,
        is_required: requiredSkillIds.has(skillId),
      })),
    )
  }

  revalidatePath('/entreprise/offres')
  revalidatePath('/offres')

  redirect('/entreprise/offres')
}

export async function changeJobStatus(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const jobId = formData.get('job_id') as string
  const newStatus = formData.get('status') as string

  if (!['active', 'closed', 'draft'].includes(newStatus)) return

  const { authorized } = await verifyOwnership(jobId, user.id)
  if (!authorized) return

  if (newStatus === 'active') {
    await supabase
      .from('job_postings')
      .update({ status: newStatus, published_at: new Date().toISOString() })
      .eq('id', jobId)
  } else {
    await supabase.from('job_postings').update({ status: newStatus }).eq('id', jobId)
  }

  revalidatePath('/entreprise/offres')
  revalidatePath('/offres')
}

export async function deleteJobPosting(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const jobId = formData.get('job_id') as string
  const { authorized, status } = await verifyOwnership(jobId, user.id)
  if (!authorized) return

  // Only allow deleting drafts
  if (status !== 'draft') return

  await supabase.from('job_postings').delete().eq('id', jobId)

  revalidatePath('/entreprise/offres')
  revalidatePath('/offres')

  redirect('/entreprise/offres')
}

// ── OFF-11 — Duplication d'offre ──────────────────────────────────────────

export async function duplicateOffer(jobId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { console.error('[duplicateOffer] non authentifié'); return }

  const { data: member } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!member) { console.error('[duplicateOffer] accès refusé'); return }

  // Lire l'offre source (doit appartenir à l'entreprise)
  const { data: source } = await supabase
    .from('job_postings')
    .select('title, description, contract_type, seniority_level, city, remote_policy, salary_range, closes_at, domain_id, mission_duration')
    .eq('id', jobId)
    .eq('company_id', member.company_id)
    .maybeSingle()

  if (!source) { console.error('[duplicateOffer] offre introuvable'); return }

  // Slug unique : base du titre + timestamp en base36
  const baseSlug = source.title
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const newSlug = `${baseSlug}-${Date.now().toString(36)}`

  const { data: newJob, error: insertErr } = await supabase
    .from('job_postings')
    .insert({
      ...source,
      title: `${source.title} (copie)`,
      slug: newSlug,
      status: 'draft',
      company_id: member.company_id,
      created_by: user.id,
      published_at: null,
      applications_count: 0,
      views_count: 0,
    })
    .select('id, slug')
    .single()

  if (insertErr || !newJob) {
    console.error('[duplicateOffer]', insertErr?.message)
    return
  }

  // Copier les skills de l'offre source
  const { data: skills } = await supabase
    .from('job_skills')
    .select('skill_id, is_required')
    .eq('job_id', jobId)

  if (skills && skills.length > 0) {
    await supabase.from('job_skills').insert(
      skills.map((s) => ({ job_id: newJob.id, skill_id: s.skill_id, is_required: s.is_required }))
    )
  }

  revalidatePath('/entreprise/offres')
  redirect(`/entreprise/offres/${newJob.slug}/modifier`)
}
