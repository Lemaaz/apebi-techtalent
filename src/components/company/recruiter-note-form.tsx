'use client'

import { useState, useTransition } from 'react'
import { saveRecruiterNote } from '@/app/entreprise/dashboard/actions'
import { StickyNote } from 'lucide-react'

export function RecruiterNoteForm({
  applicationId,
  initialNote,
}: {
  applicationId: string
  initialNote: string | null
}) {
  const [note, setNote] = useState(initialNote ?? '')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await saveRecruiterNote(applicationId, note)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="mt-2 w-full">
      <div className="flex items-center gap-1.5 mb-1">
        <StickyNote className="size-3 text-muted-foreground" aria-hidden />
        <span className="font-heading text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Note interne
        </span>
      </div>
      <div className="flex gap-1.5">
        <textarea
          value={note}
          onChange={(e) => { setNote(e.target.value); setSaved(false) }}
          onBlur={handleSave}
          placeholder="Note confidentielle (visible uniquement par votre équipe)"
          rows={2}
          disabled={isPending}
          className="w-full resize-none rounded-lg border px-2.5 py-1.5 font-sans text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-[var(--apebi-cyan)] disabled:opacity-60"
          style={{ borderColor: 'var(--apebi-border)', background: 'var(--apebi-bg-alt)' }}
        />
        {saved && (
          <span className="shrink-0 self-start pt-1 font-heading text-[10px] font-semibold text-emerald-600">
            ✓
          </span>
        )}
      </div>
    </div>
  )
}
