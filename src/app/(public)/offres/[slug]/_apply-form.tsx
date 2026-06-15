'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, Send, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { applyToJob, type ApplyState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ size: 'sm' }), 'w-full gap-2')}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Envoi en cours…
        </>
      ) : (
        <>
          <Send className="size-4" aria-hidden />
          Postuler
        </>
      )}
    </button>
  )
}

export function ApplyForm({
  jobId,
  isAuthenticated,
  hasProfile,
}: {
  jobId: string
  isAuthenticated: boolean
  hasProfile: boolean
}) {
  const [state, action] = useActionState<ApplyState, FormData>(applyToJob, {
    error: null,
    success: false,
  })

  if (state.success) {
    return (
      <div className="flex flex-col items-center rounded-xl bg-emerald-500/10 p-6 text-center">
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-emerald-500/20">
          <Check className="size-5 text-emerald-600" aria-hidden />
        </div>
        <p className="font-heading text-sm font-semibold text-emerald-700">
          Candidature envoyée !
        </p>
        <p className="mt-1 text-xs text-emerald-600">
          Le recruteur a été notifié. Suivez votre candidature depuis votre espace talent.
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-5 text-center">
        <p className="text-sm font-medium text-foreground">
          Connectez-vous pour postuler
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Vous devez être connecté avec un compte talent pour postuler.
        </p>
        <a
          href="/connexion"
          className={cn(buttonVariants({ size: 'sm' }), 'mt-4 w-full')}
        >
          Se connecter
        </a>
      </div>
    )
  }

  if (!hasProfile) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-5 text-center">
        <p className="text-sm font-medium text-foreground">
          Complétez votre profil d&apos;abord
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Créez votre profil talent pour pouvoir postuler aux offres.
        </p>
        <a
          href="/talent/inscription"
          className={cn(buttonVariants({ size: 'sm' }), 'mt-4 w-full')}
        >
          Créer mon profil
        </a>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="job_id" value={jobId} />

      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground">
          Lettre de motivation{' '}
          <span className="font-normal text-muted-foreground">(optionnel, max 1 000 car.)</span>
        </label>
        <Textarea
          name="cover_letter"
          placeholder="Expliquez brièvement pourquoi vous êtes intéressé·e par ce poste et ce que vous apporteriez à l'équipe…"
          rows={5}
          maxLength={1000}
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
