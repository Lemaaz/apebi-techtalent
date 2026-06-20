'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { createEvent, type EventFormState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-[var(--apebi-cyan)] px-4 py-2 font-heading text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? 'Création…' : 'Créer l\'événement'}
    </button>
  )
}

const inputCls =
  'w-full rounded-lg border border-[var(--apebi-border)] bg-[var(--apebi-bg-alt)] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--apebi-cyan)] focus:outline-none'
const labelCls = 'block text-xs font-semibold text-muted-foreground mb-1'

export function EventCreateForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, action] = useActionState<EventFormState, FormData>(createEvent, {
    error: null,
    success: false,
  })

  if (state.success && onSuccess) {
    onSuccess()
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ev-title" className={labelCls}>Titre *</label>
          <input id="ev-title" name="title" required maxLength={200} className={inputCls} placeholder="Conférence Tech Maroc 2026" />
        </div>
        <div>
          <label htmlFor="ev-slug" className={labelCls}>Slug URL *</label>
          <input id="ev-slug" name="slug" required maxLength={120} pattern="[a-z0-9-]+" className={inputCls} placeholder="conference-tech-maroc-2026" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ev-type" className={labelCls}>Type</label>
          <select id="ev-type" name="type_event" className={inputCls}>
            <option value="">— Sélectionner —</option>
            <option value="conference">Conférence</option>
            <option value="workshop">Workshop</option>
            <option value="job_fair">Job Fair</option>
            <option value="hackathon">Hackathon</option>
            <option value="networking">Networking</option>
          </select>
        </div>
        <div>
          <label htmlFor="ev-status" className={labelCls}>Statut</label>
          <select id="ev-status" name="status" className={inputCls}>
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ev-debut" className={labelCls}>Date de début *</label>
          <input id="ev-debut" name="date_debut" type="datetime-local" required className={inputCls} />
        </div>
        <div>
          <label htmlFor="ev-fin" className={labelCls}>Date de fin</label>
          <input id="ev-fin" name="date_fin" type="datetime-local" className={inputCls} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ev-lieu" className={labelCls}>Lieu</label>
          <input id="ev-lieu" name="lieu" maxLength={200} className={inputCls} placeholder="Casablanca / Présentiel" />
        </div>
        <div>
          <label htmlFor="ev-places" className={labelCls}>Places disponibles</label>
          <input id="ev-places" name="places_disponibles" type="number" min="1" className={inputCls} placeholder="Illimité si vide" />
        </div>
      </div>

      <div>
        <label htmlFor="ev-url" className={labelCls}>Lien d&apos;inscription externe</label>
        <input id="ev-url" name="url_inscription_externe" type="url" className={inputCls} placeholder="https://…" />
      </div>

      <div>
        <label htmlFor="ev-desc" className={labelCls}>Description</label>
        <textarea id="ev-desc" name="description" rows={4} maxLength={5000} className={inputCls} placeholder="Description de l'événement…" />
      </div>

      <div className="flex items-center gap-2">
        <input id="ev-apebi" name="is_apebi_event" type="checkbox" value="true" className="size-4 rounded border-[var(--apebi-border)]" defaultChecked />
        <label htmlFor="ev-apebi" className="text-sm text-foreground">Organisé par APEBI · Commission C5</label>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error-muted)] px-3 py-2 text-sm text-[var(--color-error-text)]">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="rounded-lg bg-[var(--color-success)]/10 px-3 py-2 text-sm text-[var(--color-success)]">
          Événement créé avec succès.
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
