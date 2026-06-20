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

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+']

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
  company_size: string
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
    company_size: '',
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
      company_size: fd.get('company_size') as string,
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
                name="company_size"
                defaultValue={step1Data.company_size}
                className={fieldCls()}
              >
                <option value="">Sélectionner…</option>
                {COMPANY_SIZES.map((r) => (
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
            APEBI avant activation. Vous recevrez un email de confirmation sous 48h.
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
