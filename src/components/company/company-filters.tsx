'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const SECTORS = [
  'Cloud & Infrastructure',
  'Data & Intelligence',
  'Cybersécurité',
  'Intelligence Artificielle',
  'Développement logiciel',
  'Transformation digitale',
  'Télécoms & Réseau',
  'EdTech',
  'FinTech',
  'Conseil IT',
] as const

const SIZES = [
  { value: '1-10', label: '1 – 10 employés' },
  { value: '11-50', label: '11 – 50 employés' },
  { value: '51-200', label: '51 – 200 employés' },
  { value: '201-500', label: '201 – 500 employés' },
  { value: '500+', label: '500+ employés' },
] as const

function useFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const current = {
    q: searchParams.get('q') ?? '',
    sector: searchParams.get('sector') ?? '',
    size: searchParams.get('size') ?? '',
    label: searchParams.get('label') === 'true',
  }

  const push = useCallback(
    (updates: Partial<typeof current>) => {
      const params = new URLSearchParams(searchParams.toString())
      const merged = { ...current, ...updates }

      if (merged.q) params.set('q', merged.q); else params.delete('q')
      if (merged.sector) params.set('sector', merged.sector); else params.delete('sector')
      if (merged.size) params.set('size', merged.size); else params.delete('size')
      if (merged.label) params.set('label', 'true'); else params.delete('label')

      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams, pathname],
  )

  const reset = useCallback(() => {
    startTransition(() => router.push(pathname))
  }, [router, pathname])

  const hasFilters = !!(current.q || current.sector || current.size || current.label)

  return { current, push, reset, hasFilters, isPending }
}

const SELECT_CLASS =
  'h-8 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white appearance-none focus:border-[var(--apebi-cyan)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--apebi-cyan)]/30'

export function CompanyFilters({ total }: { total: number }) {
  const { current, push, reset, hasFilters, isPending } = useFilters()

  return (
    <div
      className={cn(
        'transition-opacity',
        isPending && 'pointer-events-none opacity-60',
      )}
    >
      {/* Search row */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Text search */}
        <label className="relative flex flex-1 min-w-48 items-center">
          <span className="sr-only">Rechercher une entreprise</span>
          <Search
            className="pointer-events-none absolute left-3 size-4 text-white/40"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Rechercher une entreprise…"
            defaultValue={current.q}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                push({ q: (e.target as HTMLInputElement).value.trim() })
              }
            }}
            onBlur={(e) => {
              const val = e.target.value.trim()
              if (val !== current.q) push({ q: val })
            }}
            className="h-8 w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/35 focus:border-[var(--apebi-cyan)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--apebi-cyan)]/30"
          />
        </label>

        {/* Sector select */}
        <div className="relative flex items-center">
          <SlidersHorizontal
            className="pointer-events-none absolute left-2.5 size-3.5 text-white/40"
            aria-hidden
          />
          <select
            value={current.sector}
            onChange={(e) => push({ sector: e.target.value })}
            className={cn(SELECT_CLASS, 'pl-8 pr-8 w-52')}
          >
            <option className="bg-[#1a1a1a] text-white" value="">Tous secteurs</option>
            {SECTORS.map((s) => (
              <option key={s} className="bg-[#1a1a1a] text-white" value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Size select */}
        <select
          value={current.size}
          onChange={(e) => push({ size: e.target.value })}
          className={cn(SELECT_CLASS, 'pr-8 w-44')}
        >
          <option className="bg-[#1a1a1a] text-white" value="">Toute taille</option>
          {SIZES.map(({ value, label }) => (
            <option key={value} className="bg-[#1a1a1a] text-white" value={value}>{label}</option>
          ))}
        </select>

        {/* Label toggle */}
        <button
          type="button"
          onClick={() => push({ label: !current.label })}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors',
            current.label
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white',
          )}
          aria-pressed={current.label}
        >
          Label TechTalent
        </button>

        {/* Reset */}
        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-white/40 hover:bg-white/8 hover:text-white"
          >
            <X className="size-3.5" aria-hidden />
            Effacer
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="mt-3 text-xs text-white/40">
        {total} entreprise{total !== 1 ? 's' : ''}
        {hasFilters ? ' trouvée' + (total !== 1 ? 's' : '') : ''}
      </p>
    </div>
  )
}
