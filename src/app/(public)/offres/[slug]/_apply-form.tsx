'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, Send, Check } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { applyToJob, type ApplyState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--apebi-cyan)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--apebi-cyan)]/90 disabled:opacity-60"
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
      <div className="flex flex-col items-center rounded-xl bg-[var(--color-success-muted)] p-6 text-center">
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[var(--color-success)]/20">
          <Check className="size-5 text-[var(--color-success-text)]" aria-hidden />
        </div>
        <p className="font-heading text-sm font-semibold text-[var(--color-success-text)]">
          Candidature envoyée !
        </p>
        <p className="mt-1 text-xs text-[var(--color-success-text)]">
          Le recruteur a été notifié. Suivez votre candidature depuis votre espace talent.
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-[var(--apebi-border)] bg-[var(--apebi-bg-alt)] p-5 text-center">
        <p className="text-sm font-medium text-[var(--apebi-text)]">
          Connectez-vous pour postuler
        </p>
        <p className="mt-1 text-xs text-[var(--apebi-text-light)]">
          Vous devez être connecté avec un compte talent pour postuler.
        </p>
        <a
          href="/connexion"
          className="mt-4 flex w-full items-center justify-center rounded-lg bg-[var(--apebi-cyan)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--apebi-cyan)]/90"
        >
          Se connecter
        </a>
      </div>
    )
  }

  if (!hasProfile) {
    return (
      <div className="rounded-xl border border-[var(--apebi-border)] bg-[var(--apebi-bg-alt)] p-5 text-center">
        <p className="text-sm font-medium text-[var(--apebi-text)]">
          Complétez votre profil d&apos;abord
        </p>
        <p className="mt-1 text-xs text-[var(--apebi-text-light)]">
          Créez votre profil talent pour pouvoir postuler aux offres.
        </p>
        <a
          href="/talent/inscription"
          className="mt-4 flex w-full items-center justify-center rounded-lg bg-[var(--apebi-cyan)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--apebi-cyan)]/90"
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
        <label className="mb-1.5 block text-xs font-medium text-[var(--apebi-text-muted)]">
          Lettre de motivation{' '}
          <span className="font-normal text-[var(--apebi-text-light)]">(optionnel, max 1 000 car.)</span>
        </label>
        <Textarea
          name="cover_letter"
          placeholder="Expliquez brièvement pourquoi vous êtes intéressé·e par ce poste et ce que vous apporteriez à l'équipe…"
          rows={5}
          maxLength={1000}
          className="border-[var(--apebi-border)] bg-white text-[var(--apebi-text)] placeholder:text-[var(--apebi-text-light)] focus:border-[var(--apebi-cyan)] focus-visible:ring-[var(--apebi-cyan)]/30"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-[var(--color-error-muted)] px-3 py-2 text-sm text-[var(--color-error-text)]">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
