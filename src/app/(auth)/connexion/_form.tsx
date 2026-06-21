'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signIn, type SignInState } from './actions'
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button'
import { AuthDivider } from '@/components/auth/auth-divider'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={cn(buttonVariants(), 'w-full gap-2')}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? 'Connexion en cours…' : 'Se connecter'}
    </button>
  )
}

export function ConnexionForm({
  redirectTo,
  message,
  initialError,
}: {
  redirectTo: string | null
  message: string | null
  initialError: string | null
}) {
  const [state, action] = useActionState(signIn, { error: initialError })

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">Se connecter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accédez à votre espace APEBI TechTalent
        </p>
      </div>

      <GoogleOAuthButton />
      <AuthDivider />

      {message === 'password-updated' && (
        <div
          className="mb-4 flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
          role="status"
          style={{ background: 'var(--color-success-muted)', color: 'var(--color-success-text)', border: '1px solid var(--color-success)' }}
        >
          <CheckCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Mot de passe mis à jour. Connectez-vous avec votre nouveau mot de passe.
        </div>
      )}

      <form action={action} className="space-y-4">
        {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Mot de passe
            </label>
            <Link href="/mot-de-passe-oublie" className="text-xs text-primary hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
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

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="font-medium text-primary hover:underline">
          S&apos;inscrire
        </Link>
      </p>
    </div>
  )
}
