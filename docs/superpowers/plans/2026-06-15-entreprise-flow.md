# Entreprise Flow & Static Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter l'inscription entreprise (`/entreprises/inscription`), la création d'offre (`/entreprise/offres/nouvelle`), la gestion complète des offres (`/entreprise/offres`), et la page statique `/a-propos`.

**Architecture:** Pattern identique aux autres flows du projet. Server Components pour les pages protégées (Supabase auth check au top), `_form.tsx` Client Components pour les formulaires interactifs, Server Actions pour les mutations. La création d'offre utilise un slug auto-généré côté serveur (slugify du titre + nanoid pour l'unicité). L'inscription entreprise crée à la fois un `company_profiles` et un `company_members` dans la même transaction. La gestion des offres inclut les actions de changement de statut (draft → active, active → closed) et de suppression (draft seulement).

**Tech Stack:** Next.js 16 App Router · Supabase (server client) · React 19 `useActionState` · Zod v4 · Tailwind + shadcn/ui

**Prérequis:** Plan `2026-06-15-supabase-types.md` complété (types regenerated).

---

## File Map

**New files:**
```
src/app/entreprises/inscription/page.tsx          ← Server page + auth check
src/app/entreprises/inscription/_form.tsx         ← 'use client' wizard 2 étapes
src/app/entreprises/inscription/actions.ts        ← createCompanyProfile Server Action

src/app/entreprise/offres/page.tsx                ← Liste offres (Server, protégée)
src/app/entreprise/offres/loading.tsx             ← Skeleton

src/app/entreprise/offres/nouvelle/page.tsx       ← Formulaire création offre (Server)
src/app/entreprise/offres/nouvelle/_form.tsx      ← 'use client' form
src/app/entreprise/offres/nouvelle/actions.ts     ← createJobPosting Server Action

src/app/entreprise/offres/[slug]/modifier/page.tsx    ← Edit offre (Server)
src/app/entreprise/offres/[slug]/modifier/_form.tsx   ← 'use client' form
src/app/entreprise/offres/[slug]/modifier/actions.ts  ← updateJobPosting + deleteJob + changeStatus

src/app/(public)/a-propos/page.tsx               ← Page statique À propos
```

**Modified files:**
```
src/app/(public)/entreprises/page.tsx            ← Vérifier que CompanyFilters passe `total`
```

---

## Task 1: Server Action `createCompanyProfile`

**Files:**
- Create: `src/app/entreprises/inscription/actions.ts`

- [ ] **Step 1.1 — Créer le fichier**

```ts
// src/app/entreprises/inscription/actions.ts
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
  employee_count_range: z.string().optional(),
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
    employee_count_range: (formData.get('employee_count_range') as string) || undefined,
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
      employee_count_range: d.employee_count_range,
      apebi_member_since: d.apebi_member_since ? Number(d.apebi_member_since) : null,
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
```

- [ ] **Step 1.2 — Commit**

```bash
git add src/app/entreprises/inscription/actions.ts
git commit -m "feat(entreprise): add createCompanyProfile Server Action"
```

---

## Task 2: Formulaire d'inscription entreprise

**Files:**
- Create: `src/app/entreprises/inscription/_form.tsx`
- Create: `src/app/entreprises/inscription/page.tsx`

- [ ] **Step 2.1 — Créer `_form.tsx`**

```tsx
// src/app/entreprises/inscription/_form.tsx
'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createCompanyProfile, type CreateCompanyState } from './actions'

const SECTORS = [
  'Éditeur de logiciels',
  'Intégrateur / ESN',
  'Conseil en transformation digitale',
  'Cybersécurité',
  'Cloud & Infrastructure',
  'FinTech',
  'E-commerce & Retail Tech',
  'HealthTech',
  'EdTech',
  'Télécommunications',
  'Autre',
]

const EMPLOYEE_RANGES = ['1-10', '11-50', '51-200', '201-500', '500+']

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Envoi…
        </>
      ) : (
        'Soumettre ma demande'
      )}
    </button>
  )
}

type Step1 = {
  name: string
  sector: string
  city: string
  website_url: string
  linkedin_url: string
  description: string
  employee_count_range: string
  apebi_member_since: string
}

function fieldCls(error?: boolean) {
  return cn(
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
    error && 'border-rose-400',
  )
}

export function CompanyRegistrationForm() {
  const [step, setStep] = useState<1 | 2>(1)
  const [step1Data, setStep1Data] = useState<Step1>({
    name: '',
    sector: '',
    city: '',
    website_url: '',
    linkedin_url: '',
    description: '',
    employee_count_range: '',
    apebi_member_since: '',
  })

  const [state, action] = useActionState<CreateCompanyState, FormData>(
    createCompanyProfile,
    { error: null },
  )

  const handleStep1Next = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = (fd.get('name') as string).trim()
    const sector = (fd.get('sector') as string).trim()
    if (!name || !sector) return
    setStep1Data({
      name,
      sector,
      city: fd.get('city') as string,
      website_url: fd.get('website_url') as string,
      linkedin_url: fd.get('linkedin_url') as string,
      description: fd.get('description') as string,
      employee_count_range: fd.get('employee_count_range') as string,
      apebi_member_since: fd.get('apebi_member_since') as string,
    })
    setStep(2)
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs">
        <span
          className={cn(
            'flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
            step === 1 ? 'bg-primary text-white' : 'bg-primary/20 text-primary',
          )}
        >
          1
        </span>
        <span className={step === 1 ? 'text-foreground' : 'text-muted-foreground'}>
          Entreprise
        </span>
        <div className="h-px flex-1 bg-border" aria-hidden />
        <span
          className={cn(
            'flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
            step === 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground',
          )}
        >
          2
        </span>
        <span className={step === 2 ? 'text-foreground' : 'text-muted-foreground'}>
          Contact
        </span>
      </div>

      {/* Step 1 — Company info */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Nom de l&apos;entreprise <span className="text-rose-500">*</span>
              </label>
              <Input name="name" required placeholder="Acme Digital" defaultValue={step1Data.name} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Secteur <span className="text-rose-500">*</span>
              </label>
              <select
                name="sector"
                required
                defaultValue={step1Data.sector}
                className={fieldCls()}
              >
                <option value="">Sélectionner…</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Ville</label>
              <Input name="city" placeholder="Casablanca" defaultValue={step1Data.city} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Taille
              </label>
              <select
                name="employee_count_range"
                defaultValue={step1Data.employee_count_range}
                className={fieldCls()}
              >
                <option value="">Sélectionner…</option>
                {EMPLOYEE_RANGES.map((r) => (
                  <option key={r} value={r}>{r} employés</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Site web
              </label>
              <Input
                name="website_url"
                type="url"
                placeholder="https://acme.ma"
                defaultValue={step1Data.website_url}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                LinkedIn entreprise
              </label>
              <Input
                name="linkedin_url"
                type="url"
                placeholder="https://linkedin.com/company/acme"
                defaultValue={step1Data.linkedin_url}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              Présentation (max 1 000 car.)
            </label>
            <Textarea
              name="description"
              rows={4}
              maxLength={1000}
              placeholder="Décrivez votre entreprise, vos activités, votre culture…"
              defaultValue={step1Data.description}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
            >
              Suivant
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        </form>
      )}

      {/* Step 2 — Contact + submit */}
      {step === 2 && (
        <form action={action} className="space-y-4">
          {/* Hidden step 1 data */}
          {Object.entries(step1Data).map(([key, value]) =>
            value ? <input key={key} type="hidden" name={key} value={value} /> : null,
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Votre nom complet <span className="text-rose-500">*</span>
              </label>
              <Input name="contact_full_name" required placeholder="Amine Bennani" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Votre rôle dans l&apos;entreprise
              </label>
              <Input name="contact_role" placeholder="DRH, Recruteur, CEO…" />
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            <strong>Validation APEBI requise.</strong> Votre demande sera examinée par l&apos;équipe
            C5 avant activation. Vous recevrez un email de confirmation sous 48h.
          </div>

          {state.error && (
            <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
              {state.error}
            </p>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1')}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Retour
            </button>
            <SubmitButton />
          </div>
        </form>
      )}
    </div>
  )
}
```

- [ ] **Step 2.2 — Créer `page.tsx`**

```tsx
// src/app/entreprises/inscription/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CompanyRegistrationForm } from './_form'

export const metadata: Metadata = {
  title: 'Inscrire mon entreprise | APEBI TechTalent',
  description:
    'Inscrivez votre entreprise membre APEBI sur TechTalent pour accéder aux profils talents et publier vos offres.',
}

export default async function EntrepriseInscriptionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion?next=/entreprises/inscription')

  // Check if already linked to a company
  const { data: existing } = await supabase
    .from('company_members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) redirect('/entreprise/dashboard')

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex flex-1 items-start justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="size-6 text-primary" aria-hidden />
            </div>
            <h1 className="font-heading text-xl font-bold text-foreground">
              Inscrire mon entreprise
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Réservé aux membres APEBI. Votre inscription sera validée par l&apos;équipe C5.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <CompanyRegistrationForm />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Pas encore membre APEBI ?{' '}
            <a
              href="https://apebi.ma"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Rejoignez la fédération
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 2.3 — Vérifier TypeScript**

```bash
node "node_modules\typescript\bin\tsc" --noEmit
```

Expected output : aucune erreur.

- [ ] **Step 2.4 — Commit**

```bash
git add src/app/entreprises/inscription/
git commit -m "feat(entreprise): add company registration wizard"
```

---

## Task 3: Server Actions pour les offres d'emploi

**Files:**
- Create: `src/app/entreprise/offres/nouvelle/actions.ts`
- Create: `src/app/entreprise/offres/[slug]/modifier/actions.ts`

- [ ] **Step 3.1 — Créer `nouvelle/actions.ts`**

```ts
// src/app/entreprise/offres/nouvelle/actions.ts
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

  redirect(`/entreprise/offres`)
}
```

- [ ] **Step 3.2 — Créer `[slug]/modifier/actions.ts`**

```ts
// src/app/entreprise/offres/[slug]/modifier/actions.ts
'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const updateSchema = z.object({
  job_id: z.string().uuid(),
  title: z.string().min(3).max(120),
  description: z.string().min(50).max(5000),
  contract_type: z.enum(['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance']),
  seniority_level: z.enum(['Junior', 'Mid', 'Senior', 'Lead']).optional(),
  city: z.string().max(80).optional(),
  remote_policy: z.enum(['Full remote', 'Hybride', 'Présentiel']).optional(),
  salary_range: z.string().max(60).optional(),
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

  if (!member) return { supabase, authorized: false }

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
      closes_at: d.closes_at ? new Date(d.closes_at).toISOString() : null,
    })
    .eq('id', jobId)

  if (updateError) return { error: "Erreur lors de la mise à jour. Réessayez." }

  // Replace skills
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

  const update: Record<string, string | null> = { status: newStatus }
  if (newStatus === 'active') {
    update.published_at = new Date().toISOString()
  }

  await supabase.from('job_postings').update(update).eq('id', jobId)

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
```

- [ ] **Step 3.3 — Commit**

```bash
git add src/app/entreprise/offres/nouvelle/actions.ts src/app/entreprise/offres/
git commit -m "feat(entreprise): add createJobPosting, updateJobPosting, changeJobStatus, deleteJobPosting Server Actions"
```

---

## Task 4: Formulaire de création d'offre

**Files:**
- Create: `src/app/entreprise/offres/nouvelle/_form.tsx`
- Create: `src/app/entreprise/offres/nouvelle/page.tsx`

Skills loading order: fetch `skills` table first (grouped by domain) so the form can display multi-select checkboxes. Store domain groups server-side, pass to client as plain object array.

- [ ] **Step 4.1 — Créer `_form.tsx`**

```tsx
// src/app/entreprise/offres/nouvelle/_form.tsx
'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import { Loader2, CheckSquare, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createJobPosting, type CreateJobState } from './actions'

const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance'] as const
const SENIORITY_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead'] as const
const REMOTE_OPTIONS = ['Full remote', 'Hybride', 'Présentiel'] as const

export type SkillGroup = {
  domain: string
  skills: Array<{ id: string; name: string }>
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {label}
    </button>
  )
}

function fieldCls() {
  return 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
}

export function JobPostingForm({ skillGroups }: { skillGroups: SkillGroup[] }) {
  const [state, action] = useActionState<CreateJobState, FormData>(createJobPosting, { error: null })
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [requiredSkills, setRequiredSkills] = useState<Set<string>>(new Set())

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setRequiredSkills((r) => { const rn = new Set(r); rn.delete(id); return rn })
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleRequired = (id: string) => {
    if (!selectedSkills.has(id)) return
    setRequiredSkills((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <form action={action} className="space-y-6">
      {/* Hidden skill inputs */}
      {[...selectedSkills].map((id) => (
        <input key={id} type="hidden" name="skill_ids" value={id} />
      ))}
      {[...requiredSkills].map((id) => (
        <input key={id} type="hidden" name="required_skill_ids" value={id} />
      ))}

      {/* Title */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">
          Titre du poste <span className="text-rose-500">*</span>
        </label>
        <Input name="title" required placeholder="Développeur Full-Stack React / Node.js" />
      </div>

      {/* Contract + Seniority */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            Type de contrat <span className="text-rose-500">*</span>
          </label>
          <select name="contract_type" required className={fieldCls()}>
            <option value="">Sélectionner…</option>
            {CONTRACT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Niveau</label>
          <select name="seniority_level" className={fieldCls()}>
            <option value="">Tous niveaux</option>
            {SENIORITY_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Location + Remote */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Ville</label>
          <Input name="city" placeholder="Casablanca" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Télétravail</label>
          <select name="remote_policy" className={fieldCls()}>
            <option value="">Préciser…</option>
            {REMOTE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Salary + Closes at */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            Fourchette salariale
          </label>
          <Input name="salary_range" placeholder="15 000–20 000 MAD / mois" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            Date de clôture
          </label>
          <Input name="closes_at" type="date" />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">
          Description du poste <span className="text-rose-500">*</span>{' '}
          <span className="font-normal text-muted-foreground">(min 50 car.)</span>
        </label>
        <Textarea
          name="description"
          required
          rows={8}
          minLength={50}
          maxLength={5000}
          placeholder="Décrivez le poste, les missions, le contexte, les avantages…"
        />
      </div>

      {/* Skills */}
      {skillGroups.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium text-foreground">
            Compétences recherchées{' '}
            <span className="font-normal text-muted-foreground">
              — cliquez une fois pour sélectionner, deux fois pour marquer comme requise
            </span>
          </p>
          <div className="space-y-4">
            {skillGroups.map((group) => (
              <div key={group.domain}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.domain}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.skills.map((skill) => {
                    const selected = selectedSkills.has(skill.id)
                    const required = requiredSkills.has(skill.id)
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => {
                          if (!selected) {
                            toggleSkill(skill.id)
                          } else if (!required) {
                            toggleRequired(skill.id)
                          } else {
                            toggleSkill(skill.id)
                          }
                        }}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-xs transition-all',
                          !selected && 'border-border text-muted-foreground hover:border-primary/30',
                          selected && !required && 'border-primary bg-primary/10 text-primary',
                          required && 'border-rose-400 bg-rose-500/10 text-rose-600 font-medium',
                        )}
                      >
                        {required ? '★ ' : ''}{skill.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            <span className="text-primary">Bleu</span> = compétence sélectionnée ·{' '}
            <span className="text-rose-600">Rouge ★</span> = requise
          </p>
        </div>
      )}

      {state.error && (
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
          {state.error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="submit"
          name="publish_now"
          value="false"
          formAction={(fd) => { fd.set('publish_now', 'false'); return action(fd) }}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Enregistrer en brouillon
        </button>
        <button
          type="submit"
          onClick={(e) => {
            const form = e.currentTarget.closest('form') as HTMLFormElement | null
            if (form) {
              const fd = new FormData(form)
              fd.set('publish_now', 'true')
              action(fd)
              e.preventDefault()
            }
          }}
          className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
        >
          Publier maintenant
        </button>
      </div>
    </form>
  )
}
```

> **Note implémentation :** Le pattern publish_now avec deux boutons est volontairement simple — le bouton "brouillon" soumet sans publish_now, le bouton "publier" l'ajoute via JS avant soumission. Si JS est désactivé, les deux boutons fonctionnent comme brouillon.

- [ ] **Step 4.2 — Créer `page.tsx`**

```tsx
// src/app/entreprise/offres/nouvelle/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { JobPostingForm, type SkillGroup } from './_form'

export const metadata: Metadata = {
  title: 'Nouvelle offre | APEBI TechTalent',
}

type SkillRow = {
  id: string
  name: string
  domains: { name: string } | null
}

export default async function NouvelleOffrePage() {
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

  if (!member) redirect('/entreprises/inscription')

  // Fetch skills grouped by domain
  const { data: skills = [] } = await supabase
    .from('skills')
    .select('id, name, domains ( name )')
    .order('name')
    .returns<SkillRow[]>()

  const grouped = (skills ?? []).reduce<Record<string, SkillGroup>>((acc, skill) => {
    const domain = skill.domains?.name ?? 'Autres'
    if (!acc[domain]) {
      acc[domain] = { domain, skills: [] }
    }
    acc[domain].skills.push({ id: skill.id, name: skill.name })
    return acc
  }, {})

  const skillGroups = Object.values(grouped).sort((a, b) =>
    a.domain.localeCompare(b.domain, 'fr'),
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/entreprise/offres"
            className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Mes offres
          </Link>

          <h1 className="mb-6 font-heading text-xl font-bold text-foreground">
            Nouvelle offre d&apos;emploi
          </h1>

          <div className="rounded-2xl border border-border bg-card p-6">
            <JobPostingForm skillGroups={skillGroups} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 4.3 — Vérifier TypeScript**

```bash
node "node_modules\typescript\bin\tsc" --noEmit
```

- [ ] **Step 4.4 — Commit**

```bash
git add src/app/entreprise/offres/nouvelle/
git commit -m "feat(entreprise): add job posting creation form"
```

---

## Task 5: Page gestion des offres `/entreprise/offres`

**Files:**
- Create: `src/app/entreprise/offres/loading.tsx`
- Create: `src/app/entreprise/offres/page.tsx`

- [ ] **Step 5.1 — Créer `loading.tsx`**

```tsx
// src/app/entreprise/offres/loading.tsx
export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="h-14 border-b bg-background" />
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5.2 — Créer `page.tsx`**

```tsx
// src/app/entreprise/offres/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil, Eye, EyeOff, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { changeJobStatus, deleteJobPosting } from './[slug]/modifier/actions'

export const metadata: Metadata = {
  title: 'Mes offres | APEBI TechTalent',
}

type JobRow = {
  id: string
  title: string
  slug: string
  contract_type: string
  status: string
  applications_count: number
  views_count: number
  created_at: string
  published_at: string | null
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600',
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-amber-500/10 text-amber-700',
  closed: 'bg-muted/50 text-muted-foreground line-through',
  rejected: 'bg-rose-500/10 text-rose-600',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  draft: 'Brouillon',
  pending: 'En attente',
  closed: 'Fermée',
  rejected: 'Rejetée',
}

function timeAgo(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 30) return `Il y a ${diffDays} j`
  return `Il y a ${Math.floor(diffDays / 30)} mois`
}

export default async function MesOffresPage() {
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

  if (!member) redirect('/entreprises/inscription')

  const { data: jobs = [] } = await supabase
    .from('job_postings')
    .select(
      'id, title, slug, contract_type, status, applications_count, views_count, created_at, published_at',
    )
    .eq('company_id', member.company_id)
    .order('created_at', { ascending: false })
    .returns<JobRow[]>()

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-heading text-xl font-bold text-foreground">
              Mes offres
              {(jobs as JobRow[]).length > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
                  {(jobs as JobRow[]).length}
                </span>
              )}
            </h1>
            <Link
              href="/entreprise/offres/nouvelle"
              className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
            >
              <Plus className="size-3.5" aria-hidden />
              Nouvelle offre
            </Link>
          </div>

          {(jobs as JobRow[]).length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-20 text-center">
              <p className="font-heading text-sm font-semibold text-foreground">
                Aucune offre pour le moment
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Publiez votre première offre pour commencer à recevoir des candidatures.
              </p>
              <Link
                href="/entreprise/offres/nouvelle"
                className={cn(buttonVariants({ size: 'sm' }), 'mt-6 gap-1.5')}
              >
                <Plus className="size-3.5" aria-hidden />
                Créer une offre
              </Link>
            </div>
          ) : (
            <ul className="space-y-3" role="list">
              {(jobs as JobRow[]).map((job) => (
                <li
                  key={job.id}
                  className="rounded-xl border border-border bg-card px-5 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: info */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-heading text-sm font-semibold text-foreground">
                          {job.title}
                        </p>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-medium',
                            STATUS_STYLES[job.status] ?? 'bg-muted text-muted-foreground',
                          )}
                        >
                          {STATUS_LABELS[job.status] ?? job.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {job.contract_type} · {timeAgo(job.created_at)}
                        {job.published_at && ` · publiée ${timeAgo(job.published_at)}`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {job.applications_count} candidature
                        {job.applications_count !== 1 ? 's' : ''} · {job.views_count} vue
                        {job.views_count !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Right: actions */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {/* Edit */}
                      <Link
                        href={`/entreprise/offres/${job.slug}/modifier`}
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'sm' }),
                          'gap-1 text-xs',
                        )}
                      >
                        <Pencil className="size-3" aria-hidden />
                        Modifier
                      </Link>

                      {/* Toggle active/closed */}
                      {job.status === 'draft' && (
                        <form action={changeJobStatus}>
                          <input type="hidden" name="job_id" value={job.id} />
                          <input type="hidden" name="status" value="active" />
                          <button
                            type="submit"
                            className={cn(
                              buttonVariants({ variant: 'outline', size: 'sm' }),
                              'gap-1 text-xs text-emerald-600 hover:text-emerald-700',
                            )}
                          >
                            <Eye className="size-3" aria-hidden />
                            Publier
                          </button>
                        </form>
                      )}
                      {job.status === 'active' && (
                        <form action={changeJobStatus}>
                          <input type="hidden" name="job_id" value={job.id} />
                          <input type="hidden" name="status" value="closed" />
                          <button
                            type="submit"
                            className={cn(
                              buttonVariants({ variant: 'outline', size: 'sm' }),
                              'gap-1 text-xs',
                            )}
                          >
                            <EyeOff className="size-3" aria-hidden />
                            Clôturer
                          </button>
                        </form>
                      )}
                      {job.status === 'closed' && (
                        <form action={changeJobStatus}>
                          <input type="hidden" name="job_id" value={job.id} />
                          <input type="hidden" name="status" value="active" />
                          <button
                            type="submit"
                            className={cn(
                              buttonVariants({ variant: 'outline', size: 'sm' }),
                              'gap-1 text-xs text-emerald-600',
                            )}
                          >
                            <Eye className="size-3" aria-hidden />
                            Réactiver
                          </button>
                        </form>
                      )}

                      {/* Delete draft only */}
                      {job.status === 'draft' && (
                        <form action={deleteJobPosting}>
                          <input type="hidden" name="job_id" value={job.id} />
                          <button
                            type="submit"
                            className={cn(
                              buttonVariants({ variant: 'ghost', size: 'sm' }),
                              'gap-1 text-xs text-muted-foreground hover:text-rose-600',
                            )}
                          >
                            <Trash2 className="size-3" aria-hidden />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
```

- [ ] **Step 5.3 — Vérifier TypeScript**

```bash
node "node_modules\typescript\bin\tsc" --noEmit
```

- [ ] **Step 5.4 — Commit**

```bash
git add src/app/entreprise/offres/
git commit -m "feat(entreprise): add job management list with status toggle and delete"
```

---

## Task 6: Page modification d'offre

**Files:**
- Create: `src/app/entreprise/offres/[slug]/modifier/_form.tsx`
- Create: `src/app/entreprise/offres/[slug]/modifier/page.tsx`

- [ ] **Step 6.1 — Créer `_form.tsx`**

Cette form est identique à `JobPostingForm` dans `nouvelle/_form.tsx` mais pré-remplie avec les données existantes. Plutôt que de dupliquer, exporter un composant partagé depuis `src/components/jobs/job-posting-form.tsx` et l'utiliser dans les deux pages.

```tsx
// src/components/jobs/job-posting-form.tsx
'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance'] as const
const SENIORITY_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead'] as const
const REMOTE_OPTIONS = ['Full remote', 'Hybride', 'Présentiel'] as const

export type SkillGroup = {
  domain: string
  skills: Array<{ id: string; name: string }>
}

export type JobFormDefaults = {
  title?: string
  description?: string
  contract_type?: string
  seniority_level?: string | null
  city?: string | null
  remote_policy?: string | null
  salary_range?: string | null
  closes_at?: string | null
  selectedSkillIds?: string[]
  requiredSkillIds?: string[]
}

type ActionState = { error: string | null }
type Action = (_: ActionState, formData: FormData) => Promise<ActionState>

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {label}
    </button>
  )
}

function selectCls() {
  return 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
}

export function JobPostingForm({
  action,
  skillGroups,
  defaults = {},
  jobId,
  submitLabel = 'Enregistrer',
  extraActions,
}: {
  action: Action
  skillGroups: SkillGroup[]
  defaults?: JobFormDefaults
  jobId?: string
  submitLabel?: string
  extraActions?: React.ReactNode
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, { error: null })
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(
    new Set(defaults.selectedSkillIds ?? []),
  )
  const [requiredSkills, setRequiredSkills] = useState<Set<string>>(
    new Set(defaults.requiredSkillIds ?? []),
  )

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setRequiredSkills((r) => { const rn = new Set(r); rn.delete(id); return rn })
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleRequired = (id: string) => {
    if (!selectedSkills.has(id)) return
    setRequiredSkills((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <form action={formAction} className="space-y-6">
      {jobId && <input type="hidden" name="job_id" value={jobId} />}

      {[...selectedSkills].map((id) => (
        <input key={id} type="hidden" name="skill_ids" value={id} />
      ))}
      {[...requiredSkills].map((id) => (
        <input key={id} type="hidden" name="required_skill_ids" value={id} />
      ))}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">
          Titre <span className="text-rose-500">*</span>
        </label>
        <Input name="title" required defaultValue={defaults.title} placeholder="Développeur…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            Contrat <span className="text-rose-500">*</span>
          </label>
          <select name="contract_type" required defaultValue={defaults.contract_type ?? ''} className={selectCls()}>
            <option value="">Sélectionner…</option>
            {CONTRACT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Niveau</label>
          <select name="seniority_level" defaultValue={defaults.seniority_level ?? ''} className={selectCls()}>
            <option value="">Tous niveaux</option>
            {SENIORITY_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Ville</label>
          <Input name="city" placeholder="Casablanca" defaultValue={defaults.city ?? ''} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Télétravail</label>
          <select name="remote_policy" defaultValue={defaults.remote_policy ?? ''} className={selectCls()}>
            <option value="">Préciser…</option>
            {REMOTE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Salaire</label>
          <Input name="salary_range" placeholder="15 000–20 000 MAD" defaultValue={defaults.salary_range ?? ''} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Clôture</label>
          <Input
            name="closes_at"
            type="date"
            defaultValue={
              defaults.closes_at
                ? new Date(defaults.closes_at).toISOString().split('T')[0]
                : ''
            }
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">
          Description <span className="text-rose-500">*</span>
        </label>
        <Textarea name="description" required rows={8} minLength={50} maxLength={5000} defaultValue={defaults.description} placeholder="Décrivez le poste…" />
      </div>

      {skillGroups.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium text-foreground">Compétences</p>
          <div className="space-y-4">
            {skillGroups.map((group) => (
              <div key={group.domain}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.domain}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.skills.map((skill) => {
                    const selected = selectedSkills.has(skill.id)
                    const required = requiredSkills.has(skill.id)
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => {
                          if (!selected) toggleSkill(skill.id)
                          else if (!required) toggleRequired(skill.id)
                          else toggleSkill(skill.id)
                        }}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-xs transition-all',
                          !selected && 'border-border text-muted-foreground hover:border-primary/30',
                          selected && !required && 'border-primary bg-primary/10 text-primary',
                          required && 'border-rose-400 bg-rose-500/10 text-rose-600 font-medium',
                        )}
                      >
                        {required ? '★ ' : ''}{skill.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.error && (
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>{extraActions}</div>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  )
}
```

- [ ] **Step 6.2 — Mettre à jour `nouvelle/_form.tsx` pour utiliser le composant partagé**

Remplacer le contenu de `src/app/entreprise/offres/nouvelle/_form.tsx` par :

```tsx
// src/app/entreprise/offres/nouvelle/_form.tsx
'use client'

import { JobPostingForm, type SkillGroup } from '@/components/jobs/job-posting-form'
import { createJobPosting, type CreateJobState } from './actions'

export type { SkillGroup }

export function NewJobPostingForm({ skillGroups }: { skillGroups: SkillGroup[] }) {
  return (
    <JobPostingForm
      action={createJobPosting as (s: { error: string | null }, fd: FormData) => Promise<{ error: string | null }>}
      skillGroups={skillGroups}
      submitLabel="Publier l'offre"
    />
  )
}
```

> **Note:** Mettre à jour `nouvelle/page.tsx` pour importer `NewJobPostingForm` au lieu de `JobPostingForm`.

- [ ] **Step 6.3 — Créer `[slug]/modifier/page.tsx`**

```tsx
// src/app/entreprise/offres/[slug]/modifier/page.tsx
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { JobPostingForm, type SkillGroup } from '@/components/jobs/job-posting-form'
import { updateJobPosting, deleteJobPosting } from './actions'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

type Params = Promise<{ slug: string }>

type SkillRow = {
  id: string
  name: string
  domains: { name: string } | null
}

type JobSkillRow = {
  skill_id: string
  is_required: boolean
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  return { title: `Modifier offre ${slug} | APEBI TechTalent` }
}

export default async function ModifierOffrePage({ params }: { params: Params }) {
  const { slug } = await params
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

  if (!member) redirect('/entreprises/inscription')

  // Fetch job (must belong to this company)
  const { data: job } = await supabase
    .from('job_postings')
    .select(
      `id, title, description, contract_type, seniority_level, city, remote_policy,
       salary_range, closes_at, status,
       job_skills ( skill_id, is_required )`,
    )
    .eq('slug', slug)
    .eq('company_id', member.company_id)
    .maybeSingle<{
      id: string
      title: string
      description: string
      contract_type: string
      seniority_level: string | null
      city: string | null
      remote_policy: string | null
      salary_range: string | null
      closes_at: string | null
      status: string
      job_skills: JobSkillRow[]
    }>()

  if (!job) notFound()

  // Skills
  const { data: skills = [] } = await supabase
    .from('skills')
    .select('id, name, domains ( name )')
    .order('name')
    .returns<SkillRow[]>()

  const grouped = (skills ?? []).reduce<Record<string, SkillGroup>>((acc, skill) => {
    const domain = skill.domains?.name ?? 'Autres'
    if (!acc[domain]) acc[domain] = { domain, skills: [] }
    acc[domain].skills.push({ id: skill.id, name: skill.name })
    return acc
  }, {})

  const skillGroups = Object.values(grouped).sort((a, b) => a.domain.localeCompare(b.domain, 'fr'))
  const selectedSkillIds = (job.job_skills ?? []).map((js) => js.skill_id)
  const requiredSkillIds = (job.job_skills ?? []).filter((js) => js.is_required).map((js) => js.skill_id)

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/entreprise/offres"
            className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Mes offres
          </Link>

          <h1 className="mb-6 font-heading text-xl font-bold text-foreground">
            Modifier l&apos;offre
          </h1>

          <div className="rounded-2xl border border-border bg-card p-6">
            <JobPostingForm
              action={updateJobPosting}
              skillGroups={skillGroups}
              jobId={job.id}
              defaults={{
                title: job.title,
                description: job.description,
                contract_type: job.contract_type,
                seniority_level: job.seniority_level,
                city: job.city,
                remote_policy: job.remote_policy,
                salary_range: job.salary_range,
                closes_at: job.closes_at,
                selectedSkillIds,
                requiredSkillIds,
              }}
              submitLabel="Enregistrer les modifications"
              extraActions={
                job.status === 'draft' ? (
                  <form action={deleteJobPosting}>
                    <input type="hidden" name="job_id" value={job.id} />
                    <button
                      type="submit"
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        'gap-1 text-xs text-muted-foreground hover:text-rose-600',
                      )}
                    >
                      <Trash2 className="size-3" aria-hidden />
                      Supprimer
                    </button>
                  </form>
                ) : null
              }
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 6.4 — Vérifier TypeScript**

```bash
node "node_modules\typescript\bin\tsc" --noEmit
```

- [ ] **Step 6.5 — Commit**

```bash
git add src/components/jobs/job-posting-form.tsx src/app/entreprise/offres/[slug]/ src/app/entreprise/offres/nouvelle/
git commit -m "feat(entreprise): add job editing page with shared JobPostingForm component"
```

---

## Task 7: Page statique `/a-propos`

**Files:**
- Create: `src/app/(public)/a-propos/page.tsx`

- [ ] **Step 7.1 — Créer la page**

```tsx
// src/app/(public)/a-propos/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Target, Users, Building2, Briefcase, ExternalLink } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'À propos | APEBI TechTalent',
  description:
    'APEBI TechTalent est la plateforme officielle de la Fédération APEBI pour connecter les talents tech marocains aux entreprises membres du secteur numérique.',
}

const FEATURES = [
  {
    icon: Building2,
    title: 'Vitrines entreprises',
    description:
      "Chaque entreprise membre APEBI dispose d'une page dédiée pour présenter sa culture, ses valeurs et ses opportunités.",
  },
  {
    icon: Users,
    title: 'Profils talents',
    description:
      "Les professionnels tech marocains créent leur profil, déclarent leurs compétences et se rendent visibles aux recruteurs APEBI.",
  },
  {
    icon: Briefcase,
    title: "Offres d'emploi",
    description:
      'Les entreprises publient leurs offres directement sur la plateforme. Les talents postulent en quelques clics.',
  },
  {
    icon: Target,
    title: 'Matching ciblé',
    description:
      "L'accès aux profils est réservé aux recruteurs APEBI validés, garantissant des connexions de qualité dans l'écosystème.",
  },
]

const STATS = [
  { label: 'Entreprises membres', value: '150+' },
  { label: 'Emplois créés / an', value: '5 000+' },
  { label: 'Milliards MAD de CA', value: '30+' },
  { label: 'Ans d'existence', value: '30+' },
]

export default function AProposPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
              Commission C5 — APEBI
            </p>
            <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Le hub RH tech de la Fédération APEBI
            </h1>
            <p className="mt-4 text-base text-muted-foreground">
              APEBI TechTalent est la concrétisation de l&apos;Axe C (Tech Talent Bridge) de la
              Commission C5. Notre mission : connecter les talents tech marocains aux entreprises
              membres APEBI et accélérer la croissance du secteur numérique au Maroc.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/entreprises" className={cn(buttonVariants({ size: 'sm' }))}>
                Voir les entreprises
              </Link>
              <Link
                href="/offres"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                Offres d&apos;emploi
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-border bg-muted/30 px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                  <dd className="mt-1 font-heading text-2xl font-bold text-primary">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-10 text-center font-heading text-xl font-bold text-foreground">
              Comment ça marche
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-4.5 text-primary" aria-hidden />
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* About APEBI */}
        <section className="border-t border-border bg-muted/20 px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 font-heading text-xl font-bold text-foreground">
              La Fédération APEBI
            </h2>
            <p className="text-sm text-muted-foreground">
              L&apos;APEBI (Association des Professionnels des Technologies de l&apos;Information)
              est la fédération des entreprises du secteur numérique au Maroc. Fondée il y a plus
              de 30 ans, elle rassemble plus de 150 entreprises membres et représente un chiffre
              d&apos;affaires agrégé de plus de 30 milliards de dirhams.
            </p>
            <a
              href="https://apebi.ma"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'mt-6 gap-1.5',
              )}
            >
              <ExternalLink className="size-3.5" aria-hidden />
              Site officiel APEBI
            </a>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-14 text-center sm:px-6">
          <div className="mx-auto max-w-xl">
            <h2 className="mb-3 font-heading text-xl font-bold text-foreground">
              Rejoignez l&apos;écosystème
            </h2>
            <p className="mb-8 text-sm text-muted-foreground">
              Talent tech à la recherche d&apos;opportunités ou entreprise APEBI souhaitant
              recruter ? Créez votre espace dès maintenant.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/inscription" className={cn(buttonVariants({ size: 'sm' }))}>
                Créer mon profil talent
              </Link>
              <Link
                href="/entreprises/inscription"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                Inscrire mon entreprise
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
```

- [ ] **Step 7.2 — Vérifier TypeScript**

```bash
node "node_modules\typescript\bin\tsc" --noEmit
```

- [ ] **Step 7.3 — Commit**

```bash
git add src/app/(public)/a-propos/
git commit -m "feat(public): add À propos static page"
```
