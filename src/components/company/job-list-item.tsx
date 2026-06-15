import Link from 'next/link'
import { MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

// ── Types ────────────────────────────────────────────────────

export interface JobListItemData {
  id: string
  title: string
  slug: string
  contract_type: string
  seniority_level: string | null
  city: string | null
  remote_policy: string | null
  salary_range: string | null
  created_at: string
  skills: string[]
}

// ── Helpers ──────────────────────────────────────────────────

const CONTRACT_STYLES: Record<string, string> = {
  CDI: 'bg-primary/10 text-primary',
  CDD: 'bg-muted text-muted-foreground',
  Freelance: 'bg-amber-500/10 text-amber-700',
  Stage: 'bg-[#3A4652]/10 text-[#3A4652]',
  Alternance: 'bg-violet-500/10 text-violet-700',
}

const REMOTE_LABELS: Record<string, string> = {
  'Full remote': 'Full remote',
  Hybride: 'Hybride',
  Présentiel: 'Présentiel',
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 30) return `Il y a ${diffDays} j`
  const diffMonths = Math.floor(diffDays / 30)
  return `Il y a ${diffMonths} mois`
}

// ── Component ────────────────────────────────────────────────

export function JobListItem({ job }: { job: JobListItemData }) {
  const contractStyle = CONTRACT_STYLES[job.contract_type] ?? 'bg-muted text-muted-foreground'
  const location = [job.city, job.remote_policy ? REMOTE_LABELS[job.remote_policy] : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30">
      {/* Title */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold leading-snug text-foreground">
          {job.title}
        </h3>
        <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(job.created_at)}</span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', contractStyle)}>
          {job.contract_type}
        </span>
        {job.seniority_level && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {job.seniority_level}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {location && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3" aria-hidden />
            {location}
          </span>
        )}
        {job.salary_range && (
          <span className="flex items-center gap-1">
            <Clock className="size-3" aria-hidden />
            {job.salary_range}
          </span>
        )}
      </div>

      {/* Skills */}
      {job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.skills.slice(0, 4).map((s) => (
            <span
              key={s}
              className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary"
            >
              {s}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              +{job.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto pt-1">
        <Link
          href={`/offres/${job.slug}`}
          className={cn(
            buttonVariants({ size: 'sm' }),
            'w-full justify-center text-xs font-semibold',
          )}
        >
          Postuler
        </Link>
      </div>
    </article>
  )
}
