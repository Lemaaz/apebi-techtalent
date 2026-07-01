'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Search, X } from 'lucide-react'

// "Missions" est un pseudo-filtre qui regroupe Freelance + Consulting
const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Consulting', 'Stage', 'Alternance'] as const
const CONTRACT_DISPLAY: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', Freelance: 'Freelance', Consulting: 'Consulting',
  Stage: 'Stage', Alternance: 'Alternance', missions: 'Missions (Freelance / Consulting)',
}
const REMOTE_OPTIONS = ['Full remote', 'Hybride', 'Présentiel'] as const
const SENIORITY_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead'] as const

const selectCls =
  'rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 outline-none focus:border-[var(--apebi-cyan)]/50 focus:ring-1 focus:ring-[var(--apebi-cyan)]/30 transition-colors'

export function JobFilters({ total }: { total: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const update = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString())
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      next.delete('page')
      router.push(`${pathname}?${next.toString()}`)
    },
    [router, pathname, params],
  )

  const q = params.get('q') ?? ''
  const contract = params.get('contract') ?? ''
  const remote = params.get('remote') ?? ''
  const seniority = params.get('seniority') ?? ''
  const hasFilters = !!(q || contract || remote || seniority)

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/40" aria-hidden />
        <input
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[var(--apebi-cyan)]/50 focus:ring-1 focus:ring-[var(--apebi-cyan)]/30 transition-colors"
          placeholder="Rechercher une offre, un titre, une compétence…"
          defaultValue={q}
          onChange={(e) => update('q', e.target.value || null)}
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={contract}
          onChange={(e) => update('contract', e.target.value || null)}
          className={selectCls}
        >
          <option value="" className="bg-[#1a1a1a] text-white">Contrat</option>
          <option value="missions" className="bg-[#1a1a1a] text-white">Missions (Freelance / Consulting)</option>
          {CONTRACT_TYPES.map((c) => (
            <option key={c} value={c} className="bg-[#1a1a1a] text-white">{CONTRACT_DISPLAY[c] ?? c}</option>
          ))}
        </select>

        <select
          value={remote}
          onChange={(e) => update('remote', e.target.value || null)}
          className={selectCls}
        >
          <option value="" className="bg-[#1a1a1a] text-white">Télétravail</option>
          {REMOTE_OPTIONS.map((r) => (
            <option key={r} value={r} className="bg-[#1a1a1a] text-white">{r}</option>
          ))}
        </select>

        <select
          value={seniority}
          onChange={(e) => update('seniority', e.target.value || null)}
          className={selectCls}
        >
          <option value="" className="bg-[#1a1a1a] text-white">Niveau</option>
          {SENIORITY_LEVELS.map((s) => (
            <option key={s} value={s} className="bg-[#1a1a1a] text-white">{s}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-white/20 hover:text-white"
          >
            <X className="size-3" aria-hidden />
            Effacer
          </button>
        )}

        <span className="ml-auto text-xs text-white/40">
          {total} offre{total !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
