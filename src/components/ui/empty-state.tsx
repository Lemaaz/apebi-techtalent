import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────

type EmptyStateAction = {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

type EmptyStateVariant = 'default' | 'search' | 'locked'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: EmptyStateAction
  variant?: EmptyStateVariant
  className?: string
  /** Réduire le padding pour les contextes embarqués (panel, card) */
  compact?: boolean
}

// ── Presets ──────────────────────────────────────────────────

export const EMPTY_STATE_PRESETS = {
  talents: {
    title: 'Aucun talent disponible',
    description: "Les profils validés par l'équipe APEBI apparaîtront ici.",
  },
  talentsSearch: {
    title: 'Aucun résultat trouvé',
    description: "Essayez d'autres mots-clés ou supprimez certains filtres.",
    variant: 'search' as const,
  },
  offres: {
    title: 'Aucune offre active',
    description: 'Les offres publiées par les entreprises membres apparaîtront ici.',
  },
  candidatures: {
    title: 'Aucune candidature',
    description: 'Vos candidatures envoyées apparaîtront ici.',
  },
  entreprises: {
    title: 'Aucune entreprise',
    description: 'Les membres APEBI validés apparaîtront ici.',
  },
  notifications: {
    title: 'Aucune notification',
    description: 'Vous êtes à jour !',
  },
  locked: {
    title: 'Accès réservé',
    description: 'Connectez-vous pour accéder à cette section.',
    variant: 'locked' as const,
  },
} satisfies Record<string, Partial<EmptyStateProps>>

// ── Component ────────────────────────────────────────────────

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className,
      )}
    >
      {/* Icon wrapper */}
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: compact ? 48 : 64,
          height: compact ? 48 : 64,
          background: 'var(--apebi-cyan-muted)',
        }}
        aria-hidden
      >
        <Icon
          style={{
            width: compact ? 20 : 28,
            height: compact ? 20 : 28,
            color: 'var(--apebi-cyan)',
          }}
          strokeWidth={1.75}
        />
      </div>

      {/* Title */}
      <p
        className="mt-4 font-heading font-semibold text-foreground"
        style={{ fontSize: compact ? 15 : 18 }}
      >
        {title}
      </p>

      {/* Description */}
      {description && (
        <p
          className="mt-2 max-w-sm leading-relaxed text-muted-foreground"
          style={{ fontSize: 14 }}
        >
          {description}
        </p>
      )}

      {/* Action */}
      {action && <EmptyStateAction action={action} compact={compact} />}
    </div>
  )
}

// ── Action button/link ────────────────────────────────────────

function EmptyStateAction({
  action,
  compact,
}: {
  action: EmptyStateAction
  compact: boolean
}) {
  const isPrimary = action.variant !== 'secondary'

  const baseClass = cn(
    'mt-6 inline-flex items-center justify-center gap-2 rounded-lg font-heading font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)] focus-visible:ring-offset-2',
    compact ? 'px-4 py-2 text-[13px]' : 'px-5 py-2.5 text-[14px]',
    isPrimary
      ? 'bg-[var(--apebi-cyan)] text-white hover:bg-[var(--apebi-cyan-dark)]'
      : 'border border-[var(--apebi-cyan)] text-[var(--apebi-cyan)] hover:bg-[var(--apebi-cyan-muted)]',
  )

  if (action.href) {
    return (
      <Link href={action.href} className={baseClass}>
        {action.label}
      </Link>
    )
  }

  return (
    <button type="button" onClick={action.onClick} className={baseClass}>
      {action.label}
    </button>
  )
}
