import { cn } from '@/lib/utils'
import { type ApebiScore } from '@/lib/apebi-score'

interface ApebiScoreBadgeProps {
  score: ApebiScore
  /** 'compact' = badge inline · 'full' = badge + barre de progression (vitrine détail) */
  variant?: 'compact' | 'full'
  className?: string
}

/** Icône niveau sous forme de pastilles remplis/vides */
function ScoreDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <span
          key={i}
          className={cn(
            'block size-1.5 rounded-full transition-colors',
            i < level ? 'bg-current' : 'bg-current opacity-20',
          )}
        />
      ))}
    </div>
  )
}

export function ApebiScoreBadge({ score, variant = 'compact', className }: ApebiScoreBadgeProps) {
  if (score.level === 0) return null

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
          score.bgColor,
          score.color,
          className,
        )}
        title={score.description}
      >
        <ScoreDots level={score.level} />
        {score.label}
      </span>
    )
  }

  // Full variant — pour la vitrine détail
  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        score.bgColor,
        'border-current/20',
        score.color,
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-heading text-[13px] font-semibold">Score APEBI TechTalent</p>
          <p className="mt-0.5 text-[12px] opacity-80">{score.label}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <ScoreDots level={score.level} />
          <span className="font-heading text-lg font-bold">{score.level}/4</span>
        </div>
      </div>
      <p className="mt-2 text-[11px] opacity-60">{score.description}</p>

      {/* Barre de progression */}
      <div className="mt-3 h-1 w-full rounded-full bg-current/10">
        <div
          className="h-1 rounded-full bg-current transition-all"
          style={{ width: `${(score.level / 4) * 100}%` }}
          role="progressbar"
          aria-valuenow={score.level}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-label={`Niveau ${score.level} sur 4`}
        />
      </div>
    </div>
  )
}
