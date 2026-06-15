// src/app/(auth)/mot-de-passe-oublie/_form.tsx
'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetPassword, type ResetPasswordState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={cn(buttonVariants(), 'w-full')}>
      {pending ? 'Envoi…' : 'Envoyer le lien'}
    </button>
  )
}

const initialState: ResetPasswordState = { error: null, success: false }

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPassword, initialState)

  if (state.success) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="size-7 text-primary"
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
        <h1 className="font-heading text-xl font-bold text-foreground">Vérifiez votre boîte mail</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Si un compte existe pour cet email, un lien de réinitialisation vous a été envoyé.
        </p>
        <Link href="/connexion" className={cn(buttonVariants({ variant: 'outline' }), 'mt-6 w-full')}>
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saisissez votre email pour recevoir un lien de réinitialisation.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="vous@exemple.com"
          />
        </div>

        {state.error && (
          <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/connexion" className="font-medium text-primary hover:underline">
          ← Retour à la connexion
        </Link>
      </p>
    </div>
  )
}
