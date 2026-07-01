import Link from 'next/link'
import { MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const CONTRACT_STYLES: Record<string, string> = {
  CDI: 'bg-[var(--apebi-cyan)]/10 text-[var(--apebi-cyan)]',
  CDD: 'bg-amber-500/10 text-amber-400',
  Freelance: 'bg-purple-500/10 text-purple-400',
  Stage: 'bg-blue-500/10 text-blue-400',
  Alternance: 'bg-pink-500/10 text-pink-400',
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

export function JobListItem({ job }: { job: JobListItemData }) {
  const contractStyle = CONTRACT_STYLES[job.contract_type] ?? 'bg-white/8 text-white/60'
  const location = [job.city, job.remote_policy ? REMOTE_LABELS[job.remote_policy] : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-white/8 bg-[var(--apebi-dark-85)] p-4 transition-all hover:border-[var(--apebi-cyan)]/40 hover:bg-[var(--apebi-dark-80)]">
      {/* Title */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold leading-snug text-white">
          {job.title}
        </h3>
        <span className="shrink-0 text-xs text-white/35">{timeAgo(job.created_at)}</span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', contractStyle)}>
          {job.contract_type}
        </span>
        {job.seniority_level && (
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-white/55">
            {job.seniority_level}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-white/45">
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
              className="rounded-full border border-[var(--apebi-cyan)]/20 bg-[var(--apebi-cyan)]/8 px-2 py-0.5 text-[11px] font-medium text-[var(--apebi-cyan)]"
            >
              {s}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-white/50">
              +{job.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto pt-1">
        <Link
          href={`/offres/${job.slug}`}
          className="flex w-full items-center justify-center rounded-lg bg-[var(--apebi-cyan)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--apebi-cyan)]/90"
        >
          Postuler
        </Link>
      </div>
    </article>
  )
}
