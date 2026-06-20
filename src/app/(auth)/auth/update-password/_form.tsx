// src/app/(auth)/auth/update-password/_form.tsx
'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updatePassword, type UpdatePasswordState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={cn(buttonVariants(), 'w-full gap-2')}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? 'Enregistrement…' : 'Mettre à jour le mot de passe'}
    </button>
  )
}

const initialState: UpdatePasswordState = { error: null }

export function UpdatePasswordForm() {
  const [state, action] = useActionState(updatePassword, initialState)

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Nouveau mot de passe
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisissez un mot de passe sécurisé pour votre compte.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Nouveau mot de passe
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
    </div>
  )
}
