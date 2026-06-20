'use client'

import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { ChevronRight, ChevronLeft, Check, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StepIndicator } from '@/components/ui/step-indicator'
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

const INSCRIPTION_STEPS = [
  { label: 'Identité',     description: 'Prénom, nom, titre' },
  { label: 'Compétences',  description: 'Technologies et domaines' },
  { label: 'Préférences',  description: 'Disponibilité et liens' },
]

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
        <StepIndicator steps={INSCRIPTION_STEPS} currentStep={0} className="mb-6" />
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
        <StepIndicator steps={INSCRIPTION_STEPS} currentStep={1} className="mb-6" />
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
      <StepIndicator steps={INSCRIPTION_STEPS} currentStep={2} className="mb-6" />
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
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm"
            style={{ background: 'var(--color-error-muted)', color: 'var(--color-error-text)', border: '1px solid var(--color-error)' }}
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{state.error}</span>
          </div>
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
