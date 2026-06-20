// src/app/(auth)/mot-de-passe-oublie/_form.tsx
'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { AlertCircle, Mail, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetPassword, type ResetPasswordState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={cn(buttonVariants(), 'w-full gap-2')}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? 'Envoi en cours…' : 'Envoyer le lien'}
    </button>
  )
}

const initialState: ResetPasswordState = { error: null, success: false }

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPassword, initialState)

  if (state.success) {
    return (
      <div className="w-full max-w-sm text-center">
        <div
          className="mb-4 inline-flex size-14 items-center justify-center rounded-full"
          style={{ background: 'var(--apebi-cyan-muted)' }}
        >
          <Mail className="size-7" style={{ color: 'var(--apebi-cyan)' }} aria-hidden />
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
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm"
            style={{ background: 'var(--color-error-muted)', color: 'var(--color-error-text)', border: '1px solid var(--color-error)' }}
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{state.error}</span>
          </div>
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
