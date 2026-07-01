import Link from 'next/link'
import { GraduationCap, Clock, MapPin, Monitor, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ProgramCardData = {
  id: string
  slug: string
  title: string
  description: string | null
  level: string | null
  modality: string | null
  duration_text: string | null
  price_range: string | null
  is_featured: boolean
  url_inscription: string | null
  institution: { name: string; city: string | null; logo_url: string | null } | null
  domain: { name_fr: string; code: string; color: string | null } | null
}

const MODALITY_ICON = {
  Online: Monitor,
  Présentiel: MapPin,
  Hybride: MapPin,
} as const

export function ProgramCard({ program }: { program: ProgramCardData }) {
  const ModalityIcon = MODALITY_ICON[program.modality as keyof typeof MODALITY_ICON] ?? GraduationCap
  const domainColor = program.domain?.color ?? '#00AFD2'
  const detailHref = `/formation/${program.slug}`

  return (
    <Link href={detailHref} className="block">
    <article className="card-lift group flex flex-col rounded-2xl border border-white/8 bg-[var(--apebi-dark-74)] hover:border-white/16 hover:bg-[var(--apebi-dark-70)] hover:shadow-glow-soft">
      {/* Domain stripe */}
      <div
        className="h-1 w-full rounded-t-2xl"
        style={{ background: domainColor }}
        aria-hidden
      />

      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Top row: domain + featured */}
        <div className="flex items-center justify-between gap-2">
          {program.domain && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ background: `${domainColor}20`, color: domainColor }}
            >
              {program.domain.name_fr}
            </span>
          )}
          {program.is_featured && (
            <Star className="ml-auto size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Mise en avant" />
          )}
        </div>

        {/* Title */}
        <h3 className="font-heading text-[15px] font-semibold leading-snug text-white line-clamp-2">
          {program.title}
        </h3>

        {/* Institution */}
        {program.institution && (
          <p className="text-[12px] text-white/50">
            {program.institution.name}
            {program.institution.city && ` · ${program.institution.city}`}
          </p>
        )}

        {/* Description */}
        {program.description && (
          <p className="flex-1 text-[13px] leading-relaxed text-white/40 line-clamp-2">
            {program.description}
          </p>
        )}

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5">
          {program.modality && (
            <span className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/50">
              <ModalityIcon className="size-3" aria-hidden />
              {program.modality}
            </span>
          )}
          {program.level && program.level !== 'Tous niveaux' && (
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/50">
              {program.level}
            </span>
          )}
          {program.duration_text && (
            <span className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/50">
              <Clock className="size-3" aria-hidden />
              {program.duration_text}
            </span>
          )}
        </div>

        {/* Footer: price + "Voir" indicator (pas d'<a> imbriqué — la card entière est cliquable) */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          {program.price_range ? (
            <span className="text-[12px] font-medium text-white/60">{program.price_range}</span>
          ) : (
            <span />
          )}
          <span
            className={cn(
              'rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors',
              'bg-[var(--apebi-cyan)] text-[var(--apebi-dark-90)] group-hover:opacity-90',
            )}
          >
            Voir →
          </span>
        </div>
      </div>
    </article>
    </Link>
  )
}
