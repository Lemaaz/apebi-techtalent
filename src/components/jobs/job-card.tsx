// src/components/jobs/job-card.tsx
import Link from 'next/link'
import { MapPin, Wifi, Clock } from 'lucide-react'

export type JobCardData = {
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
  company: {
    name: string
    slug: string
    logo_url: string | null
    sector: string
  }
}

function timeAgo(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} j`
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem`
  return `Il y a ${Math.floor(diffDays / 30)} mois`
}

function CompanyAvatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[var(--apebi-cyan)]/10">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="size-full object-contain" />
      ) : (
        <span className="font-heading text-xs font-semibold text-[var(--apebi-cyan)]">{initials}</span>
      )}
    </div>
  )
}

const CONTRACT_COLORS: Record<string, string> = {
  CDI: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CDD: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Freelance: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Stage: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Alternance: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
}

export function JobCard({ job }: { job: JobCardData }) {
  const contractCls =
    CONTRACT_COLORS[job.contract_type] ??
    'bg-white/5 text-white/60 border-white/10'

  return (
    <Link href={`/offres/${job.slug}`} className="group block h-full">
      <article className="flex h-full flex-col rounded-xl border border-white/8 bg-[var(--apebi-dark-85)] p-5 transition-all hover:border-[var(--apebi-cyan)]/40 hover:bg-[var(--apebi-dark-80)]">
        {/* Company row */}
        <div className="mb-3 flex items-center gap-2.5">
          <CompanyAvatar name={job.company.name} logoUrl={job.company.logo_url} />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white/80">{job.company.name}</p>
            {job.company.sector && (
              <p className="truncate text-[11px] text-white/40">{job.company.sector}</p>
            )}
          </div>
        </div>

        {/* Title */}
        <p className="font-heading text-sm font-semibold leading-snug text-white line-clamp-2 group-hover:text-[var(--apebi-cyan)] transition-colors">
          {job.title}
        </p>

        {/* Meta badges */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${contractCls}`}
          >
            {job.contract_type}
          </span>
          {job.seniority_level && (
            <span className="text-xs text-white/50">{job.seniority_level}</span>
          )}
          {job.city && (
            <span className="flex items-center gap-0.5 text-xs text-white/50">
              <MapPin className="size-3" aria-hidden />
              {job.city}
            </span>
          )}
          {job.remote_policy && (
            <span className="flex items-center gap-0.5 text-xs text-white/50">
              <Wifi className="size-3" aria-hidden />
              {job.remote_policy}
            </span>
          )}
        </div>

        {/* Skills */}
        {job.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-full border border-[var(--apebi-cyan)]/20 bg-[var(--apebi-cyan)]/8 px-2 py-0.5 text-[10px] font-medium text-[var(--apebi-cyan)]"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="inline-flex items-center rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
                +{job.skills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3">
          {job.salary_range ? (
            <span className="text-[11px] font-semibold text-emerald-400">{job.salary_range}</span>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1 text-[11px] text-white/35">
            <Clock className="size-3" aria-hidden />
            {timeAgo(job.created_at)}
          </span>
        </div>
      </article>
    </Link>
  )
}
