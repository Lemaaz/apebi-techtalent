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
      <div className="flex flex-col items-center rounded-xl bg-emerald-500/10 p-6 text-center">
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-emerald-500/20">
          <Check className="size-5 text-emerald-400" aria-hidden />
        </div>
        <p className="font-heading text-sm font-semibold text-emerald-400">
          Candidature envoyée !
        </p>
        <p className="mt-1 text-xs text-emerald-500">
          Le recruteur a été notifié. Suivez votre candidature depuis votre espace talent.
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/5 p-5 text-center">
        <p className="text-sm font-medium text-white">
          Connectez-vous pour postuler
        </p>
        <p className="mt-1 text-xs text-white/45">
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
      <div className="rounded-xl border border-white/8 bg-white/5 p-5 text-center">
        <p className="text-sm font-medium text-white">
          Complétez votre profil d&apos;abord
        </p>
        <p className="mt-1 text-xs text-white/45">
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
        <label className="mb-1.5 block text-xs font-medium text-white/70">
          Lettre de motivation{' '}
          <span className="font-normal text-white/40">(optionnel, max 1 000 car.)</span>
        </label>
        <Textarea
          name="cover_letter"
          placeholder="Expliquez brièvement pourquoi vous êtes intéressé·e par ce poste et ce que vous apporteriez à l'équipe…"
          rows={5}
          maxLength={1000}
          className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-[var(--apebi-cyan)]/50 focus-visible:ring-[var(--apebi-cyan)]/30"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
