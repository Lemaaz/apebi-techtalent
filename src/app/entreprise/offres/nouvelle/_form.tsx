'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
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

function selectCls() {
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
          <select name="contract_type" required className={selectCls()}>
            <option value="">Sélectionner…</option>
            {CONTRACT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Niveau</label>
          <select name="seniority_level" className={selectCls()}>
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
          <select name="remote_policy" className={selectCls()}>
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
            <span className="text-primary">Bleu</span> = sélectionnée ·{' '}
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
        <input type="hidden" name="publish_now" value="false" id="publish-now-hidden" />
        <button
          type="submit"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Enregistrer en brouillon
        </button>
        <button
          type="button"
          onClick={(e) => {
            const form = (e.currentTarget as HTMLButtonElement).closest('form') as HTMLFormElement | null
            if (form) {
              const hiddenInput = form.querySelector('#publish-now-hidden') as HTMLInputElement | null
              if (hiddenInput) hiddenInput.value = 'true'
              form.requestSubmit()
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
