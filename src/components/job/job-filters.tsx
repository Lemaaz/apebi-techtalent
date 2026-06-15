'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance'] as const
const REMOTE_OPTIONS = ['Full remote', 'Hybride', 'Présentiel'] as const
const SENIORITY_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead'] as const

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
      next.delete('page') // reset pagination
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
        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          className="pl-8"
          placeholder="Rechercher une offre, un titre, une compétence…"
          defaultValue={q}
          onChange={(e) => update('q', e.target.value || null)}
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={contract}
          onChange={(e) => update('contract', e.target.value || null)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Contrat</option>
          {CONTRACT_TYPES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={remote}
          onChange={(e) => update('remote', e.target.value || null)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Télétravail</option>
          {REMOTE_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select
          value={seniority}
          onChange={(e) => update('seniority', e.target.value || null)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Niveau</option>
          {SENIORITY_LEVELS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1 text-xs')}
          >
            <X className="size-3" aria-hidden />
            Effacer
          </button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {total} offre{total !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
