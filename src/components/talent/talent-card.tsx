import Link from 'next/link'
import { MapPin, Eye, EyeOff, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────

type AvailabilityStatus = 'immediate' | '1month' | '3months' | 'not_available' | string | null

type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | string | null

export type TalentCardData = {
  id: string
  first_name: string
  last_name: string
  title: string | null
  city: string | null
  avatar_url: string | null
  skills: string[]
  availability: AvailabilityStatus
  seniority_level: SeniorityLevel
  /** Profil masqué pour visiteurs non recruteurs */
  isAnonymous?: boolean
}

type TalentCardProps = TalentCardData & {
  className?: string
  /** Route vers le profil complet */
  href?: string
}

// ── Helpers ──────────────────────────────────────────────────

const AVAILABILITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  immediate: {
    label: 'Disponible',
    bg: 'var(--color-success-muted)',
    text: 'var(--color-success-text)',
  },
  '1month': {
    label: 'Dispo dans 1 mois',
    bg: 'var(--color-warning-muted)',
    text: 'var(--color-warning-text)',
  },
  '3months': {
    label: 'Dispo dans 3 mois',
    bg: '#E0F2FE',
    text: '#075985',
  },
  not_available: {
    label: 'Non disponible',
    bg: 'var(--apebi-bg-alt)',
    text: 'var(--apebi-text-light)',
  },
}

const SENIORITY_LABELS: Record<string, string> = {
  junior: 'Junior',
  mid: 'Confirmé',
  senior: 'Senior',
  lead: 'Lead / Expert',
}

function getAvailabilityConfig(status: AvailabilityStatus) {
  if (!status) return AVAILABILITY_CONFIG.not_available
  return AVAILABILITY_CONFIG[status] ?? AVAILABILITY_CONFIG.not_available
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

// Couleurs de fond avatar déterministes (hash simple sur le nom)
const AVATAR_COLORS = ['#3A4652', '#1E4D5C', '#2D4A3E', '#4A2D3E']
function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

// ── Component ────────────────────────────────────────────────

export function TalentCard({
  id,
  first_name,
  last_name,
  title,
  city,
  avatar_url,
  skills,
  availability,
  seniority_level,
  isAnonymous = false,
  className,
  href,
}: TalentCardProps) {
  const displayName = isAnonymous
    ? `${first_name[0] ?? 'T'}•••••••`
    : `${first_name} ${last_name}`

  const initials = getInitials(first_name, last_name)
  const avatarBg = getAvatarColor(`${first_name}${last_name}`)
  const availConfig = getAvailabilityConfig(availability)
  const seniorityLabel = seniority_level ? (SENIORITY_LABELS[seniority_level] ?? seniority_level) : null

  // Afficher max 3 skills + overflow count
  const visibleSkills = skills.slice(0, 3)
  const overflowCount = skills.length - 3

  const profileHref = href ?? `/entreprise/talents/${id}`

  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-xl border bg-card p-5 transition-all duration-200 hover:border-[var(--apebi-cyan)] hover:shadow-[var(--shadow-card-hover)]',
        'border-[var(--apebi-border)] shadow-[var(--shadow-card)]',
        className,
      )}
      style={{ borderColor: 'var(--apebi-border)' }}
    >
      {/* ── Availability pill (top-right) ── */}
      <div
        className="absolute right-4 top-4 rounded-full px-2.5 py-0.5 font-heading text-[10px] font-semibold leading-5"
        style={{ background: availConfig.bg, color: availConfig.text }}
        aria-label={`Disponibilité : ${availConfig.label}`}
      >
        {availConfig.label}
      </div>

      {/* ── Avatar + name + title ── */}
      <div className="flex items-start gap-3 pr-28">
        {/* Avatar */}
        <div className="shrink-0" aria-hidden>
          {!isAnonymous && avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar_url}
              alt=""
              className="size-12 rounded-full object-cover"
              style={{ border: '2px solid var(--apebi-border)' }}
            />
          ) : isAnonymous ? (
            <div
              className="flex size-12 items-center justify-center rounded-full"
              style={{ background: 'var(--apebi-bg-alt)', border: '2px solid var(--apebi-border)' }}
            >
              <User className="size-5 text-muted-foreground" aria-hidden />
            </div>
          ) : (
            <div
              className="flex size-12 items-center justify-center rounded-full font-heading text-sm font-bold text-white"
              style={{ background: avatarBg }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Name + title */}
        <div className="min-w-0">
          <p className="truncate font-heading text-[15px] font-semibold text-foreground">
            {displayName}
          </p>
          {title && (
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
              {title}
            </p>
          )}
        </div>
      </div>

      {/* ── City + seniority ── */}
      {(city || seniorityLabel) && (
        <div className="mt-3 flex items-center gap-3 text-[12px] text-muted-foreground">
          {city && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{city}</span>
            </span>
          )}
          {city && seniorityLabel && (
            <span className="text-[var(--apebi-border)]" aria-hidden>·</span>
          )}
          {seniorityLabel && <span>{seniorityLabel}</span>}
        </div>
      )}

      {/* ── Skills ── */}
      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Compétences">
          {visibleSkills.map((skill) => (
            <span key={skill} className="badge-skill">
              {skill}
            </span>
          ))}
          {overflowCount > 0 && (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              style={{ background: 'var(--apebi-bg-alt)' }}
              aria-label={`${overflowCount} compétences supplémentaires`}
            >
              +{overflowCount}
            </span>
          )}
        </div>
      )}

      {/* ── Footer : visibility icon + CTA ── */}
      <div className="mt-4 flex items-center justify-between">
        <span
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
          title={isAnonymous ? 'Profil anonyme' : 'Profil visible'}
        >
          {isAnonymous ? (
            <EyeOff className="size-3" aria-hidden />
          ) : (
            <Eye className="size-3 text-[var(--apebi-cyan)]" aria-hidden />
          )}
          {isAnonymous ? 'Profil anonyme' : 'Profil visible'}
        </span>

        {isAnonymous ? (
          <Link
            href="/entreprises/inscription"
            className="rounded-lg bg-[var(--apebi-cyan)] px-3 py-1.5 font-heading text-[12px] font-semibold text-white transition-colors hover:bg-[var(--apebi-cyan-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)] focus-visible:ring-offset-2"
          >
            Demander l'accès
          </Link>
        ) : (
          <Link
            href={profileHref}
            className="rounded-lg border border-[var(--apebi-cyan)] px-3 py-1.5 font-heading text-[12px] font-semibold text-[var(--apebi-cyan)] transition-colors hover:bg-[var(--apebi-cyan-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)] focus-visible:ring-offset-2"
          >
            Voir le profil
          </Link>
        )}
      </div>
    </article>
  )
}
