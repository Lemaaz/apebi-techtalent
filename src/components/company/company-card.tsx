import Link from 'next/link'
import { Check, MapPin, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
// Deterministic colour from company name initials — no random
const AVATAR_PALETTES = [
  'bg-primary/10 text-primary',
  'bg-[#3A4652]/10 text-[#3A4652]',
  'bg-emerald-500/10 text-emerald-600',
  'bg-violet-500/10 text-violet-600',
  'bg-amber-500/10 text-amber-600',
  'bg-rose-500/10 text-rose-600',
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

// ── Props ────────────────────────────────────────────────────

// Supabase returns null for missing values; CompanyProfile uses undefined.
// This explicit type bridges both.
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

// ── Component ────────────────────────────────────────────────

export function CompanyCard({ company, jobCount }: CompanyCardProps) {
  const { name, slug, sector, city, logo_url, has_techtalent_label, apebi_member_since } = company
  const colour = avatarColour(name)

  return (
    <Link href={`/entreprises/${slug}`} aria-label={`Voir la vitrine de ${name}`}>
      <Card className="h-full transition-all hover:ring-primary/30">
        <CardContent className="flex h-full flex-col pt-5">

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
              <p className="truncate font-heading text-sm font-semibold text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{sector}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {apebi_member_since && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Check className="size-2.5" aria-hidden />
                Membre APEBI
              </span>
            )}
            {has_techtalent_label && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                <Award className="size-2.5" aria-hidden />
                Label TechTalent
              </span>
            )}
          </div>

          {/* Footer — localisation + offres */}
          <div className="mt-auto flex items-center justify-between">
            {city ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" aria-hidden />
                {city}
              </span>
            ) : (
              <span />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                jobCount > 0 ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {jobCount > 0 ? `${jobCount} offre${jobCount > 1 ? 's' : ''}` : 'Aucune offre'}
            </span>
          </div>

        </CardContent>
      </Card>
    </Link>
  )
}
