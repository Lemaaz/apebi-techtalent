'use client'

import { useRef, useState, useTransition } from 'react'
import { FileText, Upload, Loader2, Download } from 'lucide-react'
import { updateCvUrl } from '@/app/talent/profil/actions'

interface CvUploaderProps {
  currentUrl: string | null
}

export function CvUploader({ currentUrl }: CvUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [cvUrl, setCvUrl] = useState<string | null>(currentUrl)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    const form = new FormData()
    form.append('file', file)
    form.append('bucket', 'resumes')

    startTransition(async () => {
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        const json = await res.json() as { url?: string; error?: string }

        if (!res.ok || !json.url) {
          setError(json.error ?? 'Erreur lors de l\'upload')
          return
        }

        setCvUrl(json.url)
        await updateCvUrl(json.url)
      } catch {
        setError('Erreur réseau. Réessayez.')
      }
    })
  }

  return (
    <div className="space-y-2">
      {cvUrl ? (
        <div
          className="flex items-center justify-between rounded-lg px-3 py-2"
          style={{ background: 'var(--apebi-bg-alt)', border: '1px solid var(--apebi-border)' }}
        >
          <div className="flex items-center gap-2">
            <FileText className="size-4 shrink-0 text-[var(--apebi-cyan)]" aria-hidden />
            <span className="font-heading text-[12px] font-medium text-foreground">CV téléchargé</span>
          </div>
          <a
            href={cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded px-2 py-1 font-heading text-[11px] font-semibold text-[var(--apebi-cyan)] transition-colors hover:bg-[var(--apebi-cyan)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)]"
            aria-label="Télécharger mon CV"
          >
            <Download className="size-3" aria-hidden />
            Voir
          </a>
        </div>
      ) : (
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: 'var(--apebi-bg-alt)', border: '1px dashed var(--apebi-border)' }}
        >
          <p className="font-sans text-[12px] text-muted-foreground">Aucun CV déposé</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 font-heading text-[12px] font-medium text-muted-foreground transition-colors hover:border-[var(--apebi-cyan)] hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)]"
        style={{ borderColor: 'var(--apebi-border)' }}
        aria-label={cvUrl ? 'Remplacer mon CV (PDF, max 5 Mo)' : 'Déposer mon CV (PDF, max 5 Mo)'}
      >
        {isPending
          ? <Loader2 className="size-3.5 animate-spin" aria-hidden />
          : <Upload className="size-3.5" aria-hidden />}
        {cvUrl ? 'Remplacer le CV' : 'Déposer mon CV'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden
      />

      <p className="font-sans text-[11px] text-muted-foreground">PDF uniquement · max 5 Mo</p>

      {error && (
        <p className="font-sans text-[11px] text-red-500" role="alert">{error}</p>
      )}
    </div>
  )
}
