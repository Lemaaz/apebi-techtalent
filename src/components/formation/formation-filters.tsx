'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { Search, X } from 'lucide-react'

type Domain = { id: string; code: string; name_fr: string; color: string | null }

const MODALITIES = ['Présentiel', 'Online', 'Hybride']
const LEVELS = ['Débutant', 'Intermédiaire', 'Avancé']

export function FormationFilters({
  domains,
  total,
}: {
  domains: Domain[]
  total: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const q = searchParams.get('q') ?? ''
  const domainCode = searchParams.get('domain') ?? ''
  const modality = searchParams.get('modality') ?? ''
  const level = searchParams.get('level') ?? ''
  const hasFilters = !!(q || domainCode || modality || level)

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => router.replace(`${pathname}?${params.toString()}`))
  }

  function toggle(key: string, value: string) {
    update(key, searchParams.get(key) === value ? '' : value)
  }

  function reset() {
    startTransition(() => router.replace(pathname))
  }

  function selectCls() {
    return 'rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-[var(--apebi-cyan)] focus:border-[var(--apebi-cyan)] transition-colors'
  }

  return (
    <div className="space-y-4">
      {/* Search + selects row */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" aria-hidden />
          <input
            type="search"
            placeholder="Rechercher une formation…"
            value={q}
            onChange={(e) => update('q', e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--apebi-cyan)] focus:outline-none focus:ring-1 focus:ring-[var(--apebi-cyan)]"
          />
        </div>

        {/* Modality */}
        <select
          value={modality}
          onChange={(e) => update('modality', e.target.value)}
          className={selectCls()}
        >
          <option value="">Toutes modalités</option>
          {MODALITIES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Level */}
        <select
          value={level}
          onChange={(e) => update('level', e.target.value)}
          className={selectCls()}
        >
          <option value="">Tous niveaux</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/50 transition-colors hover:border-white/20 hover:text-white"
          >
            <X className="size-3.5" aria-hidden />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Domain pills */}
      {domains.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {domains.map((d) => {
            const active = domainCode === d.code
            const color = d.color ?? '#00AFD2'
            return (
              <button
                key={d.id}
                onClick={() => toggle('domain', d.code)}
                className="rounded-full border px-3 py-1 text-xs font-medium transition-all"
                style={
                  active
                    ? { background: `${color}25`, borderColor: color, color }
                    : { borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }
                }
              >
                {d.name_fr}
              </button>
            )
          })}
        </div>
      )}

      <p className="text-[12px] text-white/35">
        {total} formation{total !== 1 ? 's' : ''}{hasFilters ? ' trouvée' : ''}{total !== 1 && hasFilters ? 's' : ''}
      </p>
    </div>
  )
}
