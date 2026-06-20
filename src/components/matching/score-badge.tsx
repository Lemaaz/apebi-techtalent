import { cn } from '@/lib/utils'

export function ScoreBadge({ score }: { score: number }) {
  const tier =
    score >= 75 ? 'high' :
    score >= 50 ? 'medium' :
    'low'

  return (
    <div
      className={cn(
        'flex items-baseline gap-0.5 rounded-lg px-2.5 py-1 font-heading font-bold tabular-nums',
        tier === 'high'   && 'bg-emerald-500/12 text-emerald-500',
        tier === 'medium' && 'bg-amber-500/12 text-amber-500',
        tier === 'low'    && 'bg-rose-500/12 text-rose-500',
      )}
    >
      <span className="text-lg leading-none">{score}</span>
      <span className="text-[10px] font-medium opacity-70">/100</span>
    </div>
  )
}

export function ScoreBar({ score }: { score: number }) {
  const tier =
    score >= 75 ? 'high' :
    score >= 50 ? 'medium' :
    'low'

  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
      <div
        className={cn(
          'h-full rounded-full transition-all',
          tier === 'high'   && 'bg-emerald-500',
          tier === 'medium' && 'bg-amber-500',
          tier === 'low'    && 'bg-rose-500',
        )}
        style={{ width: `${score}%` }}
      />
    </div>
  )
}
