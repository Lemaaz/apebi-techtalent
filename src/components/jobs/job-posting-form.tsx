'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Consulting', 'Stage', 'Alternance'] as const
const MISSION_TYPES = new Set<string>(['Freelance', 'Consulting'])
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
  mission_duration?: string | null
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
  const [contractType, setContractType] = useState(defaults.contract_type ?? '')
  const isMission = MISSION_TYPES.has(contractType)

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
        setRequiredSkills((r) => {
          const rn = new Set(r)
          rn.delete(id)
          return rn
        })
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
          <select
            name="contract_type"
            required
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
            className={selectCls()}
          >
            <option value="">Sélectionner…</option>
            {CONTRACT_TYPES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Niveau</label>
          <select
            name="seniority_level"
            defaultValue={defaults.seniority_level ?? ''}
            className={selectCls()}
          >
            <option value="">Tous niveaux</option>
            {SENIORITY_LEVELS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
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
          <select
            name="remote_policy"
            defaultValue={defaults.remote_policy ?? ''}
            className={selectCls()}
          >
            <option value="">Préciser…</option>
            {REMOTE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            {isMission ? 'TJM / Budget journalier' : 'Salaire'}
          </label>
          <Input
            name="salary_range"
            placeholder={isMission ? 'ex : 1 500 MAD/jour' : '15 000–20 000 MAD/mois'}
            defaultValue={defaults.salary_range ?? ''}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Clôture</label>
          <Input
            name="closes_at"
            type="date"
            defaultValue={
              defaults.closes_at ? new Date(defaults.closes_at).toISOString().split('T')[0] : ''
            }
          />
        </div>
      </div>

      {isMission && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">
            Durée de la mission
          </label>
          <Input
            name="mission_duration"
            placeholder="ex : 3 mois, 6 mois renouvelable, durée indéterminée"
            defaultValue={defaults.mission_duration ?? ''}
          />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">
          Description <span className="text-rose-500">*</span>
        </label>
        <Textarea
          name="description"
          required
          rows={8}
          minLength={50}
          maxLength={5000}
          defaultValue={defaults.description}
          placeholder="Décrivez le poste…"
        />
      </div>

      {skillGroups.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium text-foreground">Compétences</p>
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
                          if (!selected) toggleSkill(skill.id)
                          else if (!required) toggleRequired(skill.id)
                          else toggleSkill(skill.id)
                        }}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-xs transition-all',
                          !selected &&
                            'border-border text-muted-foreground hover:border-primary/30',
                          selected && !required && 'border-primary bg-primary/10 text-primary',
                          required && 'border-rose-400 bg-rose-500/10 text-rose-600 font-medium',
                        )}
                      >
                        {required ? '★ ' : ''}
                        {skill.name}
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
