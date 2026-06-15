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
    is_current: boolean | null
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
