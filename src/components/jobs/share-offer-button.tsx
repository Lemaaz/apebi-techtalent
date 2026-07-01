'use client'

import { useState } from 'react'
import { Share2, Check, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShareOfferButtonProps {
  offerUrl: string
  title: string
}

export function ShareOfferButton({ offerUrl, title }: ShareOfferButtonProps) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(offerUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback : sélectionner l'URL via prompt (navigateurs sans clipboard API)
      window.prompt('Copiez ce lien :', offerUrl)
    }
  }

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(offerUrl)}`
  const whatsappUrl  = `https://wa.me/?text=${encodeURIComponent(`${title} — ${offerUrl}`)}`

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={copyLink}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-heading text-[12px] font-semibold transition-all',
          copied
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
            : 'border-white/15 bg-white/5 text-white/55 hover:border-[var(--apebi-cyan)]/40 hover:text-[var(--apebi-cyan)]',
        )}
        aria-label={copied ? 'Lien copié !' : 'Copier le lien'}
      >
        {copied
          ? <><Check className="size-3" aria-hidden />Copié !</>
          : <><Share2 className="size-3" aria-hidden />Partager</>
        }
      </button>

      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-heading text-[12px] font-semibold text-white/45 hover:border-[#0A66C2]/40 hover:text-[#0A66C2] transition-colors"
        aria-label="Partager sur LinkedIn"
        title="Partager sur LinkedIn"
      >
        <ExternalLink className="size-3" aria-hidden />
        LinkedIn
      </a>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-heading text-[12px] font-semibold text-white/45 hover:border-[#25D366]/40 hover:text-[#25D366] transition-colors"
        aria-label="Partager sur WhatsApp"
        title="Partager sur WhatsApp"
      >
        WhatsApp
      </a>
    </div>
  )
}
