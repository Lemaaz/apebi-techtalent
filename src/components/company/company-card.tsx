import Link from 'next/link'
import { Check, MapPin, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { computeApebiScore } from '@/lib/apebi-score'
import { ApebiScoreBadge } from './apebi-score-badge'

const AVATAR_PALETTES = [
  'bg-[var(--apebi-cyan)]/10 text-[var(--apebi-cyan)]',
  'bg-white/8 text-white/60',
  'bg-emerald-500/10 text-emerald-400',
  'bg-violet-500/10 text-violet-400',
  'bg-amber-500/10 text-amber-400',
  'bg-rose-500/10 text-rose-400',
] as const

function avatarColour(name: string) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length]
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

interface CompanyCardProps {
  company: {
    id: string
    name: string
    slug: string
    sector: string
    company_size: string | null | undefined
    city: string | null | undefined
    logo_url: string | null | undefined
    has_techtalent_label: boolean
    apebi_member_since: string | null | undefined
  }
  jobCount: number
}

export function CompanyCard({ company, jobCount }: CompanyCardProps) {
  const { name, slug, sector, city, logo_url, has_techtalent_label, apebi_member_since } = company
  const colour = avatarColour(name)
  const score = computeApebiScore({ apebi_member_since, has_techtalent_label, logo_url, activeJobCount: jobCount })

  return (
    <Link
      href={`/entreprises/${slug}`}
      aria-label={`Voir la vitrine de ${name}`}
      className="group block"
    >
      <div className="flex h-full flex-col rounded-xl border border-white/8 bg-[var(--apebi-dark-85)] p-5 transition-all hover:border-[var(--apebi-cyan)]/40 hover:bg-[var(--apebi-dark-80)]">

        {/* Header — avatar + nom */}
        <div className="mb-3 flex items-center gap-3">
          {logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo_url}
              alt={`Logo ${name}`}
              className="size-10 shrink-0 rounded-lg object-contain"
              loading="lazy"
            />
          ) : (
            <div
              aria-hidden
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg font-heading text-sm font-semibold',
                colour,
              )}
            >
              {initials(name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-semibold text-white group-hover:text-[var(--apebi-cyan)] transition-colors">
              {name}
            </p>
            <p className="truncate text-xs text-white/50">{sector}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {apebi_member_since && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--apebi-cyan)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--apebi-cyan)]">
              <Check className="size-2.5" aria-hidden />
              Membre APEBI
            </span>
          )}
          {has_techtalent_label && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
              <Award className="size-2.5" aria-hidden />
              Label TechTalent
            </span>
          )}
        </div>

        {/* Score APEBI */}
        {score.level > 0 && (
          <div className="mb-3">
            <ApebiScoreBadge score={score} variant="compact" />
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between">
          {city ? (
            <span className="flex items-center gap-1 text-xs text-white/40">
              <MapPin className="size-3" aria-hidden />
              {city}
            </span>
          ) : (
            <span />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              jobCount > 0 ? 'text-[var(--apebi-cyan)]' : 'text-white/35',
            )}
          >
            {jobCount > 0 ? `${jobCount} offre${jobCount > 1 ? 's' : ''}` : 'Aucune offre'}
          </span>
        </div>

      </div>
    </Link>
  )
}
