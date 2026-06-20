'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  bucket: 'avatars' | 'logos' | 'banners'
  fieldName: string
  currentUrl?: string | null
  label: string
  hint?: string
  shape?: 'square' | 'wide'
  accept?: string
}

export function ImageUpload({
  bucket,
  fieldName,
  currentUrl,
  label,
  hint,
  shape = 'square',
  accept = 'image/jpeg,image/png,image/webp',
}: ImageUploadProps) {
  const [url, setUrl] = useState(currentUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      const body = new FormData()
      body.append('file', file)
      body.append('bucket', bucket)

      const res = await fetch('/api/upload', { method: 'POST', body })
      const json = (await res.json()) as { url?: string; error?: string }

      if (!res.ok || json.error) {
        setError(json.error ?? 'Erreur upload')
      } else if (json.url) {
        setUrl(json.url)
      }
    } catch {
      setError('Erreur réseau — réessayez.')
    } finally {
      setUploading(false)
      // Reset file input so the same file can be re-selected if needed
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const isWide = shape === 'wide'

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}

      {/* Hidden field carries the URL into the server action */}
      <input type="hidden" name={fieldName} value={url} />

      <div className={isWide ? 'w-full' : 'w-fit'}>
        {url ? (
          <div className={cn('relative', isWide ? 'w-full' : 'w-24')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className={cn(
                'rounded-lg border border-border bg-muted/30 object-cover',
                isWide ? 'h-28 w-full' : 'h-24 w-24',
              )}
            />
            <button
              type="button"
              onClick={() => setUrl('')}
              className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-rose-500 text-white shadow hover:bg-rose-600"
              aria-label="Supprimer l'image"
            >
              <X className="size-2.5" aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50',
              isWide ? 'h-28 w-full' : 'h-24 w-24',
            )}
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <>
                <Upload className="size-5" aria-hidden />
                <span className="text-[10px]">
                  {isWide ? 'Choisir une image' : 'Choisir'}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Hidden real file input */}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleFile}
        aria-hidden
      />

      {error && (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500">
          <ImageIcon className="size-3 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}
