'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Briefcase, Check, Loader2, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { inviterAPostuler } from '@/app/entreprise/talents/[id]/actions'

type Job = { id: string; title: string; slug: string; city: string | null }

interface InviteToApplyModalProps {
  talentId: string
  talentFirstName: string
  jobs: Job[]
}

export function InviteToApplyModal({ talentId, talentFirstName, jobs }: InviteToApplyModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Sync <dialog> open state
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) close()
  }

  // Trap Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function close() {
    setOpen(false)
    setSelectedJobId('')
    setMessage('')
    setError(null)
    // Keep `sent` so the CTA button shows "Invitation envoyée" after
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedJobId) return
    setError(null)
    startTransition(async () => {
      const result = await inviterAPostuler(talentId, selectedJobId, message)
      if (result.success) {
        setSent(true)
        close()
      } else {
        setError(result.error ?? 'Erreur inconnue')
      }
    })
  }

  // If no active jobs, show disabled state
  const hasJobs = jobs.length > 0

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setSent(false); setOpen(true) }}
        disabled={!hasJobs}
        className={cn(
          'inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 font-heading text-[13px] font-semibold transition-all',
          hasJobs
            ? sent
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
              : 'bg-[var(--apebi-cyan)] text-white hover:bg-[var(--apebi-cyan-dark)]'
            : 'cursor-not-allowed bg-gray-100 text-gray-400',
        )}
        title={!hasJobs ? 'Publiez une offre active pour inviter ce talent' : undefined}
      >
        {sent ? (
          <><Check className="size-3.5" aria-hidden />Invitation envoyée</>
        ) : (
          <><Send className="size-3.5" aria-hidden />Inviter à postuler</>
        )}
      </button>

      {!hasJobs && (
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
          Aucune offre active pour le moment.
        </p>
      )}

      {/* Modal */}
      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        className="m-auto w-full max-w-md rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-black/40"
        aria-labelledby="invite-dialog-title"
      >
        <form onSubmit={handleSubmit} noValidate>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--apebi-cyan)]/10">
                <Send className="size-4 text-[var(--apebi-cyan)]" aria-hidden />
              </div>
              <h2 id="invite-dialog-title" className="font-heading text-[15px] font-semibold text-gray-900">
                Inviter {talentFirstName} à postuler
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              className="flex size-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Fermer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4 px-6 py-5">
            {/* Job selection */}
            <div>
              <label htmlFor="job-select" className="mb-1.5 block font-heading text-[13px] font-semibold text-gray-700">
                Offre d'emploi <span className="text-[var(--apebi-cyan)]">*</span>
              </label>
              <select
                id="job-select"
                required
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-sans text-[13px] text-gray-900 transition-colors focus:border-[var(--apebi-cyan)] focus:outline-none focus:ring-2 focus:ring-[var(--apebi-cyan)]/20"
              >
                <option value="">Sélectionner une offre active…</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}{job.city ? ` — ${job.city}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Personal message */}
            <div>
              <label htmlFor="invite-message" className="mb-1.5 block font-heading text-[13px] font-semibold text-gray-700">
                Message personnalisé <span className="text-[11px] font-normal text-gray-400">(optionnel)</span>
              </label>
              <textarea
                id="invite-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                placeholder={`Bonjour ${talentFirstName}, votre profil a retenu notre attention…`}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 font-sans text-[13px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[var(--apebi-cyan)] focus:outline-none focus:ring-2 focus:ring-[var(--apebi-cyan)]/20"
              />
              <p className="mt-1 text-right text-[11px] text-gray-400">{message.length}/500</p>
            </div>

            {/* Info box */}
            <div className="flex gap-2.5 rounded-lg bg-[#f0fafd] px-3 py-2.5">
              <Briefcase className="mt-0.5 size-3.5 shrink-0 text-[var(--apebi-cyan)]" aria-hidden />
              <p className="text-[12px] leading-relaxed text-[#005a75]">
                {talentFirstName} recevra un email d'invitation et une notification sur la plateforme avec un lien direct vers votre offre.
              </p>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-gray-200 px-4 py-2 font-heading text-[13px] font-medium text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!selectedJobId || isPending}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-5 py-2 font-heading text-[13px] font-semibold text-white transition-all',
                selectedJobId && !isPending
                  ? 'bg-[var(--apebi-cyan)] hover:bg-[var(--apebi-cyan-dark)]'
                  : 'cursor-not-allowed bg-gray-300',
              )}
            >
              {isPending ? (
                <><Loader2 className="size-3.5 animate-spin" />Envoi…</>
              ) : (
                <><Send className="size-3.5" />Envoyer l'invitation</>
              )}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
