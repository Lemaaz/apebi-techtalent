import Link from 'next/link'
import { cn } from '@/lib/utils'

type FilterOption = {
  label: string
  value: string
  count?: number
}

type AdminPageHeaderProps = {
  title: string
  totalCount?: number
  description?: string
  filters?: FilterOption[]
  activeFilter?: string
  filterBaseHref: string
  filterParam?: string
  actions?: React.ReactNode
}

export function AdminPageHeader({
  title,
  totalCount,
  description,
  filters,
  activeFilter,
  filterBaseHref,
  filterParam = 'status',
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            {title}
            {totalCount !== undefined && (
              <span className="ml-2 font-heading text-base font-normal text-muted-foreground">
                ({totalCount})
              </span>
            )}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {/* Status filter pills */}
      {filters && filters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par statut">
          {filters.map(({ label, value, count }) => {
            const isActive = activeFilter === value || (!activeFilter && !value)
            const href = value
              ? `${filterBaseHref}?${filterParam}=${value}`
              : filterBaseHref

            return (
              <Link
                key={value}
                href={href}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-heading text-[12px] font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--apebi-cyan)] text-white shadow-sm'
                    : 'bg-[var(--apebi-bg-alt)] text-[var(--apebi-text-muted)] hover:bg-[var(--apebi-border)] hover:text-foreground',
                )}
              >
                {label}
                {count !== undefined && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--apebi-border)] text-[var(--apebi-text-muted)]',
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
