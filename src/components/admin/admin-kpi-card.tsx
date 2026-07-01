import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type AdminKpiCardProps = {
  label: string
  value: number | string
  icon: LucideIcon
  href?: string
  /** Afficher l'état "urgent" (fond amber, icône amber) */
  urgent?: boolean
  /** Sous-label optionnel (tendance, sous-titre) */
  sublabel?: string
  className?: string
}

export function AdminKpiCard({
  label,
  value,
  icon: Icon,
  href,
  urgent = false,
  sublabel,
  className,
}: AdminKpiCardProps) {
  const content = (
    <div
      className={cn(
        'group rounded-xl border bg-card p-5 transition-all duration-200',
        href && 'card-lift cursor-pointer hover:border-[var(--apebi-cyan)] hover:shadow-[var(--shadow-card-hover)]',
        urgent
          ? 'border-[var(--color-warning)]'
          : 'border-[var(--apebi-border)] shadow-[var(--shadow-card)]',
        className,
      )}
    >
      {/* Icon + badge urgent */}
      <div className="mb-4 flex items-center justify-between">
        <div
          className="flex size-10 items-center justify-center rounded-lg"
          style={{
            background: urgent
              ? 'var(--color-warning-muted)'
              : 'var(--apebi-cyan-muted)',
          }}
          aria-hidden
        >
          <Icon
            className="size-5"
            style={{ color: urgent ? 'var(--color-warning)' : 'var(--apebi-cyan)' }}
          />
        </div>

        {urgent && (
          <span className="badge-pending">
            À traiter
          </span>
        )}
      </div>

      {/* Value */}
      <p
        className="font-heading text-3xl font-bold tabular-nums text-foreground"
        aria-label={`${label} : ${value}`}
      >
        {value}
      </p>

      {/* Label */}
      <p className="mt-1 text-[13px] text-muted-foreground">{label}</p>

      {/* Sublabel */}
      {sublabel && (
        <p className="mt-2 text-[11px] text-muted-foreground">{sublabel}</p>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block" aria-label={`${label} : ${value} — Voir le détail`}>
        {content}
      </Link>
    )
  }

  return content
}
