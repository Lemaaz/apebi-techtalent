'use client'
import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { Building2, UserCircle, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signUp, type SignUpState } from './actions'
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button'
import { AuthDivider } from '@/components/auth/auth-divider'

type Role = 'talent' | 'entreprise'

const ROLES = [
  {
    value: 'talent' as Role,
    icon: UserCircle,
    title: 'Je suis un talent tech',
    description: "Je cherche une opportunité dans l'écosystème APEBI",
  },
  {
    value: 'entreprise' as Role,
    icon: Building2,
    title: 'Je représente une entreprise',
    description: 'Je recrute des talents tech pour mon entreprise membre APEBI',
  },
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={cn(buttonVariants(), 'w-full')}>
      {pending ? 'Création du compte…' : 'Créer mon compte'}
    </button>
  )
}

const initialState: SignUpState = { error: null, success: false }

export function InscriptionForm() {
  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<Role | null>(null)
  const [state, action] = useActionState(signUp, initialState)

  if (state.success) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
          <svg
            className="size-7 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground">
          Vérifiez votre boîte mail
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Un lien de confirmation a été envoyé à votre adresse email. Cliquez dessus pour activer
          votre compte.
        </p>
        <Link
          href="/connexion"
          className={cn(buttonVariants({ variant: 'outline' }), 'mt-6 w-full')}
        >
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-center gap-2">
        <span className={cn('h-1.5 w-8 rounded-full transition-colors', step >= 1 ? 'bg-primary' : 'bg-muted')} />
        <span className={cn('h-1.5 w-8 rounded-full transition-colors', step >= 2 ? 'bg-primary' : 'bg-muted')} />
      </div>

      {step === 1 && (
        <div>
          <div className="mb-6 text-center">
            <h1 className="font-heading text-2xl font-bold text-foreground">Je suis…</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choisissez votre profil pour commencer
            </p>
          </div>

          <div className="mb-4">
            <GoogleOAuthButton label="S'inscrire avec Google" />
          </div>
          <AuthDivider />

          <div className="mt-4 space-y-3">
            {ROLES.map(({ value, icon: Icon, title, description }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all',
                  role === value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30',
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg',
                    role === value
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </div>
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => role && setStep(2)}
            disabled={!role}
            className={cn(buttonVariants(), 'mt-6 w-full')}
          >
            Continuer
          </button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link href="/connexion" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      )}

      {step === 2 && (
        <div>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="mb-5 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Modifier mon choix
          </button>

          <div className="mb-6">
            <h1 className="font-heading text-2xl font-bold text-foreground">Créer mon compte</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {role === 'talent'
                ? 'Espace talent APEBI TechTalent'
                : 'Espace recruteur APEBI TechTalent'}
            </p>
          </div>

          <form action={action} className="space-y-4">
            <input type="hidden" name="role" value={role ?? ''} />

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email professionnel
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="vous@entreprise.ma"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Mot de passe
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Minimum 8 caractères"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm" className="text-sm font-medium text-foreground">
                Confirmer le mot de passe
              </label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="••••••••"
              />
            </div>

            {state.error && (
              <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
                {state.error}
              </p>
            )}

            <SubmitButton />

            <p className="text-center text-xs text-muted-foreground">
              En créant un compte, vous acceptez les conditions d&apos;utilisation de la plateforme
              APEBI TechTalent.
            </p>
          </form>
        </div>
      )}
    </div>
  )
}
