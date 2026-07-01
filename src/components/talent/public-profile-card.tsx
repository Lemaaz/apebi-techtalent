'use client'

import { useState, useTransition } from 'react'
import { Globe, Check, Copy, RefreshCw, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { togglePublicProfile, regeneratePublicToken } from '@/app/talent/profil/actions'

interface PublicProfileCardProps {
  enabled: boolean
  token: string | null
  appUrl: string
}

export function PublicProfileCard({ enabled, token, appUrl }: PublicProfileCardProps) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  const publicUrl = token ? `${appUrl}/t/${token}` : ''

  function handleToggle() {
    startTransition(async () => {
      await togglePublicProfile(isEnabled)
      setIsEnabled(!isEnabled)
    })
  }

  async function copyLink() {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copiez ce lien :', publicUrl)
    }
  }

  function handleRegenerate() {
    startTransition(async () => {
      await regeneratePublicToken()
    })
  }

  const linkedinShare = publicUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`
    : '#'

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'white', border: '1px solid var(--apebi-border)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-heading text-[13px] font-semibold text-foreground">
          <Globe className="size-3.5 text-[var(--apebi-cyan)]" aria-hidden />
          Profil public
        </p>
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          role="switch"
          aria-checked={isEnabled}
          aria-label={isEnabled ? 'Désactiver le profil public' : 'Activer le profil public'}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50',
            isEnabled ? 'bg-[var(--apebi-cyan)]' : 'bg-muted',
          )}
        >
          <span className={cn('pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform', isEnabled ? 'translate-x-4' : 'translate-x-0')} />
        </button>
      </div>

      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
        {isEnabled
          ? 'Votre profil est accessible via un lien partageable (sans votre email). Idéal à mettre sur LinkedIn.'
          : 'Générez un lien public partageable de votre profil, à mettre sur LinkedIn ou votre CV.'}
      </p>

      {isEnabled && publicUrl && (
        <div className="space-y-2">
          {/* Lien + copie */}
          <div className="flex items-center gap-1.5 rounded-lg border px-2 py-1.5" style={{ borderColor: 'var(--apebi-border)', background: 'var(--apebi-bg-alt)' }}>
            <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted-foreground">
              /t/{token?.slice(0, 8)}…
            </span>
            <button
              type="button"
              onClick={copyLink}
              className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors', copied ? 'text-emerald-600' : 'text-[var(--apebi-cyan)] hover:underline')}
            >
              {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5">
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              style={{ borderColor: 'var(--apebi-border)' }}
            >
              <ExternalLink className="size-3" aria-hidden />
              Aperçu
            </a>
            <a
              href={linkedinShare}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-[#0A66C2]"
              style={{ borderColor: 'var(--apebi-border)' }}
            >
              <ExternalLink className="size-3" aria-hidden />
              LinkedIn
            </a>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={pending}
              title="Régénérer le lien (invalide l'ancien)"
              className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              style={{ borderColor: 'var(--apebi-border)' }}
            >
              <RefreshCw className="size-3" aria-hidden />
              Nouveau lien
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
