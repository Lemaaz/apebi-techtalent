'use client'

import { useRef, useState, useTransition } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { updateAvatarUrl } from '@/app/talent/profil/actions'

const AVATAR_COLORS = ['#3A4652', '#1E4D5C', '#2D4A3E', '#4A2D3E']
function avatarColor(name: string): string {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

interface AvatarUploaderProps {
  currentUrl: string | null
  fullName: string
  initials: string
}

export function AvatarUploader({ currentUrl, fullName, initials }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Local preview immédiat
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    const form = new FormData()
    form.append('file', file)
    form.append('bucket', 'avatars')

    startTransition(async () => {
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        const json = await res.json() as { url?: string; error?: string }

        if (!res.ok || !json.url) {
          setError(json.error ?? 'Erreur lors de l\'upload')
          setPreview(currentUrl)
          return
        }

        await updateAvatarUrl(json.url)
      } catch {
        setError('Erreur réseau. Réessayez.')
        setPreview(currentUrl)
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="group relative shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)] focus-visible:ring-offset-2"
        aria-label="Changer la photo de profil"
        title="Changer la photo de profil"
      >
        {/* Avatar image or placeholder */}
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={fullName}
            className="size-16 rounded-2xl object-cover"
            style={{ border: '2px solid var(--apebi-border)' }}
          />
        ) : (
          <div
            className="flex size-16 items-center justify-center rounded-2xl font-heading text-xl font-bold text-white"
            style={{ background: avatarColor(fullName) }}
            aria-hidden
          >
            {initials}
          </div>
        )}

        {/* Overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden
        >
          {isPending
            ? <Loader2 className="size-5 animate-spin text-white" />
            : <Camera className="size-5 text-white" />}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden
      />

      {error && (
        <p className="text-[11px] text-red-500" role="alert">{error}</p>
      )}
    </div>
  )
}
