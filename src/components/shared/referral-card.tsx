'use client'

import { useState } from 'react'
import { Gift, Check, Copy, ExternalLink, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReferralCardProps {
  url: string
  invitedCount: number
  variant?: 'light' | 'dark'
}

export function ReferralCard({ url, invitedCount, variant = 'light' }: ReferralCardProps) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copiez ce lien :', url)
    }
  }

  const shareText = 'Rejoignez APEBI TechTalent, la plateforme officielle des talents tech marocains'
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${shareText} — ${url}`)}`

  const dark = variant === 'dark'

  return (
    <div
      className={cn('rounded-xl border p-5', dark ? 'border-white/10 bg-[var(--apebi-dark-74)]' : '')}
      style={dark ? undefined : { background: 'white', borderColor: 'var(--apebi-border)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="mb-1 flex items-center gap-2">
        <div
          className="flex size-8 items-center justify-center rounded-lg"
          style={{ background: 'var(--apebi-cyan-muted, rgba(0,175,210,0.12))' }}
        >
          <Gift className="size-4" style={{ color: 'var(--apebi-cyan)' }} aria-hidden />
        </div>
        <p className={cn('font-heading text-[14px] font-semibold', dark ? 'text-white' : 'text-foreground')}>
          Parrainez l&apos;écosystème
        </p>
      </div>

      <p className={cn('mb-4 text-[12px] leading-relaxed', dark ? 'text-white/50' : 'text-muted-foreground')}>
        Invitez un talent ou une entreprise membre à rejoindre APEBI TechTalent.
        {invitedCount > 0 && (
          <>
            {' '}
            <span className={cn('font-semibold', dark ? 'text-white/80' : 'text-foreground')}>
              {invitedCount} {invitedCount > 1 ? 'personnes ont' : 'personne a'} rejoint grâce à vous.
            </span>
          </>
        )}
      </p>

      {/* Lien + copie */}
      <div
        className={cn('mb-3 flex items-center gap-2 rounded-lg border px-3 py-2', dark ? 'border-white/10 bg-white/5' : '')}
        style={dark ? undefined : { borderColor: 'var(--apebi-border)', background: 'var(--apebi-bg-alt)' }}
      >
        <span className={cn('min-w-0 flex-1 truncate font-mono text-[11px]', dark ? 'text-white/60' : 'text-muted-foreground')}>
          {url.replace(/^https?:\/\//, '')}
        </span>
        <button
          type="button"
          onClick={copyLink}
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors',
            copied ? 'text-emerald-500' : 'text-[var(--apebi-cyan)] hover:opacity-80',
          )}
          aria-label={copied ? 'Copié' : 'Copier le lien'}
        >
          {copied ? <><Check className="size-3" aria-hidden />Copié</> : <><Copy className="size-3" aria-hidden />Copier</>}
        </button>
      </div>

      {/* Partage */}
      <div className="flex flex-wrap gap-2">
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={cn('inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors', dark ? 'border-white/15 text-white/60 hover:text-[#0A66C2]' : 'text-muted-foreground hover:text-[#0A66C2]')}
          style={dark ? undefined : { borderColor: 'var(--apebi-border)' }}
        >
          <ExternalLink className="size-3" aria-hidden />
          LinkedIn
        </a>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={cn('inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors', dark ? 'border-white/15 text-white/60 hover:text-[#25D366]' : 'text-muted-foreground hover:text-[#25D366]')}
          style={dark ? undefined : { borderColor: 'var(--apebi-border)' }}
        >
          <Users className="size-3" aria-hidden />
          WhatsApp
        </a>
      </div>
    </div>
  )
}
