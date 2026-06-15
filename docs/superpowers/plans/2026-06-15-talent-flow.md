# Talent Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter le flow complet côté talent : wizard d'inscription (création de profil), édition du profil, et liste des candidatures.

**Architecture:** Trois routes protégées. Chaque route suit le pattern établi : Server Component page qui charge les données Supabase → Client Component `_form.tsx` pour l'interactivité → `actions.ts` pour les Server Actions Zod-validées. L'inscription est un wizard 3 étapes dont les données s'accumulent en state local côté client et se soumettent en un seul appel Server Action final.

**Tech Stack:** Next.js 16 App Router · Supabase (server client) · React 19 `useActionState` · Zod v4 · Tailwind + shadcn/ui

**Prérequis:** Plan `2026-06-15-supabase-types.md` complété (types régénérés).

---

## File Map

**New files:**
```
src/app/talent/inscription/page.tsx          ← Server Component : charge domains+skills
src/app/talent/inscription/_form.tsx         ← 'use client' : wizard 3 étapes
src/app/talent/inscription/actions.ts        ← createTalentProfile Server Action
src/app/talent/profil/modifier/page.tsx      ← Server Component : charge profil + skills
src/app/talent/profil/modifier/_form.tsx     ← 'use client' : formulaire d'édition
src/app/talent/profil/modifier/actions.ts    ← updateProfile + skill/exp/edu CRUD
src/app/talent/candidatures/page.tsx         ← Server Component : liste candidatures
src/app/talent/candidatures/loading.tsx      ← Skeleton loader
```

---

## Task 1: Server Action `createTalentProfile`

**Files:**
- Create: `src/app/talent/inscription/actions.ts`

- [ ] **Step 1.1 — Créer le fichier**

```ts
// src/app/talent/inscription/actions.ts
'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  const skill_ids = formData.getAll('skill_ids') as string[]
  const job_type = formData.getAll('job_type') as string[]

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
    await supabase
      .from('talent_skills')
      .insert(skill_ids.map((skill_id) => ({ talent_id: profile.id, skill_id })))
  }

  redirect('/talent/profil')
}
```

- [ ] **Step 1.2 — Commit**

```bash
git add src/app/talent/inscription/actions.ts
git commit -m "feat(talent): add createTalentProfile Server Action"
```

---

## Task 2: Page `/talent/inscription` — wizard 3 étapes

**Files:**
- Create: `src/app/talent/inscription/page.tsx`
- Create: `src/app/talent/inscription/_form.tsx`

- [ ] **Step 2.1 — Créer `page.tsx` (Server Component)**

```tsx
// src/app/talent/inscription/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { TalentInscriptionForm } from './_form'

type DomainWithSkills = {
  id: string
  name_fr: string
  color: string | null
  skills: { id: string; name: string }[]
}

export default async function TalentInscriptionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Check if profile already exists
  const { data: existing } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) redirect('/talent/profil')

  // Load domains + skills for step 2
  const { data: domains } = await supabase
    .from('domains')
    .select('id, name_fr, color, skills(id, name)')
    .order('name_fr')
    .returns<DomainWithSkills[]>()

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h1 className="font-heading text-xl font-bold text-foreground">
              Créez votre profil talent
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Renseignez votre profil pour être visible auprès des entreprises membres APEBI.
            </p>
          </div>
          <TalentInscriptionForm domains={domains ?? []} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 2.2 — Créer `_form.tsx` (Client Component wizard)**

```tsx
// src/app/talent/inscription/_form.tsx
'use client'

import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createTalentProfile, type CreateProfileState } from './actions'

type DomainWithSkills = {
  id: string
  name_fr: string
  color: string | null
  skills: { id: string; name: string }[]
}

type Step1Data = {
  first_name: string
  last_name: string
  title: string
  bio: string
  city: string
}

const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance'] as const
const AVAILABILITIES = ['Immédiate', '1 mois', '3 mois', 'Non disponible'] as const
const REMOTE_OPTIONS = ['Full remote', 'Hybride', 'Présentiel'] as const

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Création en cours…
        </>
      ) : (
        <>
          <Check className="size-4" aria-hidden />
          Créer mon profil
        </>
      )}
    </button>
  )
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="mb-6 flex items-center gap-2" aria-label="Étapes">
      {([1, 2, 3] as const).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={cn(
              'flex size-6 items-center justify-center rounded-full text-[11px] font-semibold',
              s < current
                ? 'bg-primary text-white'
                : s === current
                  ? 'bg-primary/10 text-primary ring-2 ring-primary'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {s < current ? <Check className="size-3" /> : s}
          </div>
          {s < 3 && (
            <div
              className={cn('h-px w-8', s < current ? 'bg-primary' : 'bg-border')}
              aria-hidden
            />
          )}
        </div>
      ))}
    </div>
  )
}

export function TalentInscriptionForm({ domains }: { domains: DomainWithSkills[] }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [s1, setS1] = useState<Step1Data>({
    first_name: '',
    last_name: '',
    title: '',
    bio: '',
    city: '',
  })
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [state, action] = useActionState<CreateProfileState, FormData>(createTalentProfile, {
    error: null,
  })

  const step1Valid = s1.first_name.trim().length > 0 && s1.last_name.trim().length > 0

  const toggleSkill = (id: string) =>
    setSelectedSkills((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  // ── Step 1: Identité ──────────────────────────────────────────
  if (step === 1) {
    return (
      <div>
        <StepIndicator current={1} />
        <h2 className="mb-5 font-heading text-base font-semibold text-foreground">
          Votre identité
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Prénom <span className="text-rose-500">*</span>
              </label>
              <Input
                value={s1.first_name}
                onChange={(e) => setS1((p) => ({ ...p, first_name: e.target.value }))}
                placeholder="Karim"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Nom <span className="text-rose-500">*</span>
              </label>
              <Input
                value={s1.last_name}
                onChange={(e) => setS1((p) => ({ ...p, last_name: e.target.value }))}
                placeholder="El Amrani"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              Titre professionnel
            </label>
            <Input
              value={s1.title}
              onChange={(e) => setS1((p) => ({ ...p, title: e.target.value }))}
              placeholder="Développeur Full Stack · React & Node.js"
              maxLength={100}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              Ville
            </label>
            <Input
              value={s1.city}
              onChange={(e) => setS1((p) => ({ ...p, city: e.target.value }))}
              placeholder="Casablanca"
              maxLength={100}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              Bio{' '}
              <span className="text-muted-foreground font-normal">
                ({s1.bio.length}/500)
              </span>
            </label>
            <Textarea
              value={s1.bio}
              onChange={(e) => setS1((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Décrivez votre parcours et vos ambitions en quelques lignes…"
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}
            >
              Continuer
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 2: Compétences ───────────────────────────────────────
  if (step === 2) {
    return (
      <div>
        <StepIndicator current={2} />
        <h2 className="mb-1 font-heading text-base font-semibold text-foreground">
          Vos compétences
        </h2>
        <p className="mb-5 text-xs text-muted-foreground">
          Sélectionnez les technologies et domaines que vous maîtrisez.
          {selectedSkills.size > 0 && (
            <span className="ml-1 font-medium text-primary">
              {selectedSkills.size} sélectionnée{selectedSkills.size > 1 ? 's' : ''}
            </span>
          )}
        </p>
        <div className="max-h-[420px] overflow-y-auto space-y-5 pr-1">
          {domains.map((domain) => (
            <div key={domain.id}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {domain.name_fr}
              </p>
              <div className="flex flex-wrap gap-2">
                {domain.skills.map((skill) => {
                  const selected = selectedSkills.has(skill.id)
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs transition-colors',
                        selected
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                      )}
                    >
                      {selected && <Check className="mr-1 inline size-3" aria-hidden />}
                      {skill.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1')}
          >
            <ChevronLeft className="size-4" aria-hidden />
            Retour
          </button>
          <button
            onClick={() => setStep(3)}
            className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}
          >
            Continuer
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  // ── Step 3: Préférences — le <form> réel ──────────────────────
  return (
    <div>
      <StepIndicator current={3} />
      <h2 className="mb-5 font-heading text-base font-semibold text-foreground">
        Préférences &amp; liens
      </h2>

      <form action={action} className="space-y-5">
        {/* Hidden inputs from step 1 */}
        <input type="hidden" name="first_name" value={s1.first_name} />
        <input type="hidden" name="last_name" value={s1.last_name} />
        {s1.title && <input type="hidden" name="title" value={s1.title} />}
        {s1.bio && <input type="hidden" name="bio" value={s1.bio} />}
        {s1.city && <input type="hidden" name="city" value={s1.city} />}

        {/* Hidden inputs from step 2 (skills) */}
        {[...selectedSkills].map((id) => (
          <input key={id} type="hidden" name="skill_ids" value={id} />
        ))}

        {/* Disponibilité */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            Disponibilité
          </label>
          <select
            name="availability"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Non renseignée</option>
            {AVAILABILITIES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Mode de travail */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            Mode de travail souhaité
          </label>
          <select
            name="remote_preference"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Non renseigné</option>
            {REMOTE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Types de contrats */}
        <div>
          <label className="mb-2 block text-xs font-medium text-foreground">
            Contrats recherchés
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTRACT_TYPES.map((type) => (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
              >
                <input type="checkbox" name="job_type" value={type} className="sr-only" />
                {type}
              </label>
            ))}
          </div>
        </div>

        {/* Salaire */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            Prétentions salariales (MAD/mois)
          </label>
          <Input
            name="expected_salary_range"
            placeholder="Ex: 15 000 – 20 000 MAD"
            maxLength={50}
          />
        </div>

        {/* Liens */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-foreground">Liens professionnels</p>
          <Input name="linkedin_url" placeholder="https://linkedin.com/in/votre-profil" type="url" />
          <Input name="github_url" placeholder="https://github.com/votre-compte" type="url" />
          <Input name="portfolio_url" placeholder="https://votre-portfolio.com" type="url" />
        </div>

        {state.error && (
          <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
            {state.error}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setStep(2)}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1')}
          >
            <ChevronLeft className="size-4" aria-hidden />
            Retour
          </button>
          <SubmitButton />
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2.3 — Commit**

```bash
git add src/app/talent/inscription/
git commit -m "feat(talent): add talent inscription wizard (3-step profile creation)"
```

---

## Task 3: Server Actions pour `/talent/profil/modifier`

**Files:**
- Create: `src/app/talent/profil/modifier/actions.ts`

- [ ] **Step 3.1 — Créer le fichier**

```ts
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

export async function updateTalentSkills(formData: FormData) {
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
  await supabase.from('talent_skills').delete().eq('talent_id', talent.id)

  if (skill_ids.length > 0) {
    await supabase
      .from('talent_skills')
      .insert(skill_ids.map((skill_id) => ({ talent_id: talent.id, skill_id })))
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

  await supabase.from('experiences').insert({ ...parsed.data, talent_id: talent.id })

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
    .eq('talent_id', talent.id) // RLS safety belt

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

  await supabase.from('educations').insert({ ...parsed.data, talent_id: talent.id })

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
    .eq('talent_id', talent.id)

  revalidatePath('/talent/profil')
  revalidatePath('/talent/profil/modifier')
}
```

- [ ] **Step 3.2 — Commit**

```bash
git add src/app/talent/profil/modifier/actions.ts
git commit -m "feat(talent): add profile/skills/experience/education update Server Actions"
```

---

## Task 4: Page `/talent/profil/modifier`

**Files:**
- Create: `src/app/talent/profil/modifier/page.tsx`
- Create: `src/app/talent/profil/modifier/_form.tsx`

- [ ] **Step 4.1 — Créer `page.tsx`**

```tsx
// src/app/talent/profil/modifier/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { EditProfileForm } from './_form'

type DomainWithSkills = {
  id: string
  name_fr: string
  color: string | null
  skills: { id: string; name: string }[]
}

export default async function ModifierProfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select(
      `id, first_name, last_name, title, bio, city, years_experience, seniority_level,
       availability, remote_preference, expected_salary_range, job_type,
       linkedin_url, github_url, portfolio_url,
       talent_skills ( skill_id ),
       experiences ( id, company_name, title, description, start_date, end_date, is_current, location ),
       educations ( id, institution, degree, field, start_year, end_year )`,
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (!talent) redirect('/talent/inscription')

  const { data: domains } = await supabase
    .from('domains')
    .select('id, name_fr, color, skills(id, name)')
    .order('name_fr')
    .returns<DomainWithSkills[]>()

  const currentSkillIds = new Set(
    (talent.talent_skills ?? []).map((ts: { skill_id: string }) => ts.skill_id),
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/talent/profil"
            className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Retour au profil
          </Link>
          <h1 className="mb-8 font-heading text-xl font-bold text-foreground">
            Modifier mon profil
          </h1>
          <EditProfileForm
            talent={talent}
            domains={domains ?? []}
            currentSkillIds={currentSkillIds}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 4.2 — Créer `_form.tsx`**

```tsx
// src/app/talent/profil/modifier/_form.tsx
'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Check, Loader2, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  updateTalentProfile,
  updateTalentSkills,
  addExperience,
  deleteExperience,
  addEducation,
  deleteEducation,
  type UpdateProfileState,
  type ExperienceState,
  type EducationState,
} from './actions'

type DomainWithSkills = {
  id: string
  name_fr: string
  color: string | null
  skills: { id: string; name: string }[]
}

const SENIORITY_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead', 'Expert'] as const
const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance'] as const
const AVAILABILITIES = ['Immédiate', '1 mois', '3 mois', 'Non disponible'] as const
const REMOTE_OPTIONS = ['Full remote', 'Hybride', 'Présentiel'] as const

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}
    >
      {pending ? (
        <><Loader2 className="size-4 animate-spin" aria-hidden />Enregistrement…</>
      ) : (
        <><Check className="size-4" aria-hidden />Enregistrer</>
      )}
    </button>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 font-heading text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  )
}

type TalentData = {
  first_name: string
  last_name: string
  title: string | null
  bio: string | null
  city: string | null
  years_experience: number | null
  seniority_level: string | null
  availability: string | null
  remote_preference: string | null
  expected_salary_range: string | null
  job_type: string[] | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  experiences: Array<{
    id: string
    company_name: string
    title: string
    description: string | null
    start_date: string
    end_date: string | null
    is_current: boolean
    location: string | null
  }>
  educations: Array<{
    id: string
    institution: string
    degree: string | null
    field: string | null
    start_year: number | null
    end_year: number | null
  }>
}

export function EditProfileForm({
  talent,
  domains,
  currentSkillIds,
}: {
  talent: TalentData
  domains: DomainWithSkills[]
  currentSkillIds: Set<string>
}) {
  const [profileState, profileAction] = useActionState<UpdateProfileState, FormData>(
    updateTalentProfile,
    { error: null, success: false },
  )
  const [expState, expAction] = useActionState<ExperienceState, FormData>(addExperience, {
    error: null,
  })
  const [eduState, eduAction] = useActionState<EducationState, FormData>(addEducation, {
    error: null,
  })

  return (
    <div className="space-y-6">
      {/* ── Informations générales ── */}
      <SectionCard title="Informations générales">
        <form action={profileAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Prénom <span className="text-rose-500">*</span>
              </label>
              <Input name="first_name" defaultValue={talent.first_name} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Nom <span className="text-rose-500">*</span>
              </label>
              <Input name="last_name" defaultValue={talent.last_name} required />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              Titre professionnel
            </label>
            <Input name="title" defaultValue={talent.title ?? ''} maxLength={100} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Ville</label>
              <Input name="city" defaultValue={talent.city ?? ''} maxLength={100} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Années d&apos;expérience
              </label>
              <Input
                name="years_experience"
                type="number"
                min={0}
                max={50}
                defaultValue={talent.years_experience ?? ''}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              Niveau de séniorité
            </label>
            <select
              name="seniority_level"
              defaultValue={talent.seniority_level ?? ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Non renseigné</option>
              {SENIORITY_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              Bio <span className="text-muted-foreground font-normal">(max 500)</span>
            </label>
            <Textarea name="bio" defaultValue={talent.bio ?? ''} rows={4} maxLength={500} />
          </div>

          {/* Préférences */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Disponibilité</label>
              <select
                name="availability"
                defaultValue={talent.availability ?? ''}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Non renseignée</option>
                {AVAILABILITIES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Télétravail</label>
              <select
                name="remote_preference"
                defaultValue={talent.remote_preference ?? ''}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Non renseigné</option>
                {REMOTE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              Prétentions salariales (MAD/mois)
            </label>
            <Input
              name="expected_salary_range"
              defaultValue={talent.expected_salary_range ?? ''}
              maxLength={50}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-foreground">
              Contrats recherchés
            </label>
            <div className="flex flex-wrap gap-2">
              {CONTRACT_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                >
                  <input
                    type="checkbox"
                    name="job_type"
                    value={type}
                    defaultChecked={talent.job_type?.includes(type)}
                    className="sr-only"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Liens */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Liens professionnels</p>
            <Input name="linkedin_url" defaultValue={talent.linkedin_url ?? ''} placeholder="https://linkedin.com/in/…" type="url" />
            <Input name="github_url" defaultValue={talent.github_url ?? ''} placeholder="https://github.com/…" type="url" />
            <Input name="portfolio_url" defaultValue={talent.portfolio_url ?? ''} placeholder="https://…" type="url" />
          </div>

          {profileState.error && (
            <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
              {profileState.error}
            </p>
          )}
          {profileState.success && (
            <p role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
              Profil mis à jour avec succès.
            </p>
          )}
          <div className="flex justify-end">
            <SaveButton />
          </div>
        </form>
      </SectionCard>

      {/* ── Compétences ── */}
      <SectionCard title="Compétences">
        <form action={updateTalentSkills} className="space-y-4">
          <div className="max-h-64 overflow-y-auto space-y-4 pr-1">
            {domains.map((domain) => (
              <div key={domain.id}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {domain.name_fr}
                </p>
                <div className="flex flex-wrap gap-2">
                  {domain.skills.map((skill) => (
                    <label
                      key={skill.id}
                      className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                    >
                      <input
                        type="checkbox"
                        name="skill_ids"
                        value={skill.id}
                        defaultChecked={currentSkillIds.has(skill.id)}
                        className="sr-only"
                      />
                      {skill.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button type="submit" className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}>
              <Check className="size-4" aria-hidden />
              Mettre à jour les compétences
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Expériences ── */}
      <SectionCard title="Expériences">
        {/* Existing experiences */}
        {talent.experiences.length > 0 && (
          <ul className="mb-4 space-y-3">
            {talent.experiences.map((exp) => (
              <li key={exp.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{exp.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {exp.company_name}
                    {exp.location ? ` · ${exp.location}` : ''}
                  </p>
                </div>
                <form action={deleteExperience}>
                  <input type="hidden" name="experience_id" value={exp.id} />
                  <button
                    type="submit"
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'shrink-0 text-rose-500 hover:text-rose-600')}
                    aria-label="Supprimer cette expérience"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {/* Add experience form */}
        <form action={expAction} className="space-y-3 rounded-lg bg-muted/40 p-4">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Plus className="size-3.5" aria-hidden />
            Ajouter une expérience
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input name="title" placeholder="Titre du poste *" required />
            <Input name="company_name" placeholder="Entreprise *" required />
          </div>
          <Input name="location" placeholder="Ville (optionnel)" />
          <Textarea name="description" placeholder="Description (optionnel, max 500)" rows={2} maxLength={500} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Date de début *</label>
              <Input name="start_date" type="date" required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Date de fin</label>
              <Input name="end_date" type="date" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" name="is_current" value="true" className="rounded" />
            Poste actuel
          </label>
          {expState.error && (
            <p role="alert" className="text-xs text-rose-600">{expState.error}</p>
          )}
          <div className="flex justify-end">
            <button type="submit" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 text-xs')}>
              <Plus className="size-3.5" aria-hidden />
              Ajouter
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Formation ── */}
      <SectionCard title="Formation">
        {talent.educations.length > 0 && (
          <ul className="mb-4 space-y-3">
            {talent.educations.map((edu) => (
              <li key={edu.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {edu.degree}{edu.field ? ` en ${edu.field}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">{edu.institution}</p>
                </div>
                <form action={deleteEducation}>
                  <input type="hidden" name="education_id" value={edu.id} />
                  <button
                    type="submit"
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'shrink-0 text-rose-500 hover:text-rose-600')}
                    aria-label="Supprimer cette formation"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={eduAction} className="space-y-3 rounded-lg bg-muted/40 p-4">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Plus className="size-3.5" aria-hidden />
            Ajouter une formation
          </p>
          <Input name="institution" placeholder="Établissement *" required />
          <div className="grid grid-cols-2 gap-3">
            <Input name="degree" placeholder="Diplôme (ex: Master)" />
            <Input name="field" placeholder="Spécialité (ex: Informatique)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Année début</label>
              <Input name="start_year" type="number" min={1950} max={2030} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Année fin</label>
              <Input name="end_year" type="number" min={1950} max={2035} />
            </div>
          </div>
          {eduState.error && (
            <p role="alert" className="text-xs text-rose-600">{eduState.error}</p>
          )}
          <div className="flex justify-end">
            <button type="submit" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 text-xs')}>
              <Plus className="size-3.5" aria-hidden />
              Ajouter
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}
```

- [ ] **Step 4.3 — Commit**

```bash
git add src/app/talent/profil/modifier/
git commit -m "feat(talent): add edit profile page with skills/experience/education CRUD"
```

---

## Task 5: Page `/talent/candidatures`

**Files:**
- Create: `src/app/talent/candidatures/page.tsx`
- Create: `src/app/talent/candidatures/loading.tsx`

- [ ] **Step 5.1 — Créer `loading.tsx`**

```tsx
// src/app/talent/candidatures/loading.tsx
export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="h-14 border-b border-border bg-background" />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 5.2 — Créer `page.tsx`**

```tsx
// src/app/talent/candidatures/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Mes candidatures | APEBI TechTalent',
}

const STATUS_STYLES: Record<string, string> = {
  sent: 'bg-muted text-muted-foreground',
  viewed: 'bg-primary/10 text-primary',
  shortlisted: 'bg-emerald-500/10 text-emerald-600',
  rejected: 'bg-rose-500/10 text-rose-600',
  accepted: 'bg-violet-500/10 text-violet-600',
}

const STATUS_LABELS: Record<string, string> = {
  sent: 'Envoyée',
  viewed: 'Vue',
  shortlisted: 'Présélectionné·e',
  rejected: 'Refusée',
  accepted: 'Acceptée',
}

type ApplicationRow = {
  id: string
  status: string
  created_at: string
  cover_letter: string | null
  job_postings: {
    id: string
    title: string
    slug: string
    contract_type: string
    city: string | null
    remote_policy: string | null
    company_profiles: {
      name: string
      slug: string
      logo_url: string | null
    } | null
  } | null
}

function timeAgo(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 30) return `Il y a ${diffDays} j`
  return `Il y a ${Math.floor(diffDays / 30)} mois`
}

export default async function CandidaturesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!talent) redirect('/talent/inscription')

  const { data: applications = [] } = await supabase
    .from('applications')
    .select(
      `id, status, created_at, cover_letter,
       job_postings (
         id, title, slug, contract_type, city, remote_policy,
         company_profiles ( name, slug, logo_url )
       )`,
    )
    .eq('talent_id', talent.id)
    .order('created_at', { ascending: false })
    .returns<ApplicationRow[]>()

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/talent/profil"
            className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Mon profil
          </Link>

          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-heading text-xl font-bold text-foreground">
              Mes candidatures
              {(applications as ApplicationRow[]).length > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
                  {(applications as ApplicationRow[]).length}
                </span>
              )}
            </h1>
            <Link href="/offres" className="text-xs text-primary hover:underline">
              Voir les offres →
            </Link>
          </div>

          {(applications as ApplicationRow[]).length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
              <Briefcase className="mb-3 size-8 text-muted-foreground" aria-hidden />
              <p className="font-heading text-sm font-semibold text-foreground">
                Aucune candidature pour le moment
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Explorez les offres des entreprises membres APEBI.
              </p>
              <Link
                href="/offres"
                className="mt-4 text-xs font-medium text-primary hover:underline"
              >
                Voir les offres →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3" role="list">
              {(applications as ApplicationRow[]).map((app) => {
                const job = app.job_postings
                const company = job?.company_profiles
                return (
                  <li
                    key={app.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-heading text-sm font-semibold text-foreground">
                          {job?.title ?? 'Offre supprimée'}
                        </p>
                        {company && (
                          <Link
                            href={`/entreprises/${company.slug}`}
                            className="mt-0.5 text-xs text-primary hover:underline"
                          >
                            {company.name}
                          </Link>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {job?.contract_type}
                          {job?.city ? ` · ${job.city}` : ''}
                          {job?.remote_policy ? ` · ${job.remote_policy}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-medium',
                            STATUS_STYLES[app.status] ?? 'bg-muted text-muted-foreground',
                          )}
                        >
                          {STATUS_LABELS[app.status] ?? app.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {timeAgo(app.created_at)}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
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

Expected output : aucune erreur.

- [ ] **Step 5.4 — Commit**

```bash
git add src/app/talent/candidatures/
git commit -m "feat(talent): add candidatures page with status tracking"
```
