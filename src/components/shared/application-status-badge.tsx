import { cn } from '@/lib/utils'
import { Send, Eye, Star, Check, X, Clock } from 'lucide-react'

// ── Config pipeline candidature ───────────────────────────────
// Statuts : sent → viewed → shortlisted → accepted | rejected

type ApplicationStatus = 'sent' | 'viewed' | 'shortlisted' | 'accepted' | 'rejected' | string

type StatusConfig = {
  label: string
  /** CSS custom property classes (via style=) */
  bg: string
  text: string
  border: string
  icon: React.ElementType
}

const CONFIG: Record<string, StatusConfig> = {
  sent: {
    label: 'Envoyée',
    bg: 'var(--apebi-bg-alt)',
    text: 'var(--apebi-text-muted)',
    border: 'var(--apebi-border)',
    icon: Send,
  },
  viewed: {
    label: 'Vue',
    bg: 'var(--apebi-cyan-muted)',
    text: 'var(--color-info-text)',
    border: 'rgba(0,175,210,0.25)',
    icon: Eye,
  },
  shortlisted: {
    label: 'Présélectionné·e',
    bg: 'var(--color-success-muted)',
    text: 'var(--color-success-text)',
    border: 'var(--color-success)',
    icon: Star,
  },
  accepted: {
    label: 'Accepté·e',
    bg: '#EDE9FE',
    text: '#5B21B6',
    border: '#7C3AED',
    icon: Check,
  },
  rejected: {
    label: 'Refusée',
    bg: 'var(--color-error-muted)',
    text: 'var(--color-error-text)',
    border: 'var(--color-error)',
    icon: X,
  },
}

// Alias recruteur (même statuts, labels "actifs")
const RECRUITER_LABELS: Partial<Record<string, string>> = {
  sent: 'Reçue',
  shortlisted: 'Présélectionné·e',
  accepted: 'Accepté·e',
  rejected: 'Refusé·e',
}

export function ApplicationStatusBadge({
  status,
  recruiterView = false,
  noIcon = false,
  className,
}: {
  status: ApplicationStatus
  /** Afficher les labels du point de vue recruteur */
  recruiterView?: boolean
  noIcon?: boolean
  className?: string
}) {
  const cfg = CONFIG[status] ?? CONFIG.sent
  const Icon = cfg.icon
  const label = recruiterView ? (RECRUITER_LABELS[status] ?? cfg.label) : cfg.label

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-heading text-[11px] font-semibold',
        className,
      )}
      style={{
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {!noIcon && <Icon className="size-3 shrink-0" aria-hidden />}
      {label}
    </span>
  )
}

// ── Status action buttons (pipeline recruteur) ────────────────

type ActionConfig = {
  targetStatus: string
  label: string
  style: { background: string; color: string; border: string }
}

const TRANSITIONS: Record<string, ActionConfig[]> = {
  sent:        [{ targetStatus: 'shortlisted', label: 'Shortlister', style: { background: 'var(--color-success-muted)', color: 'var(--color-success-text)', border: 'var(--color-success)' } }, { targetStatus: 'rejected', label: 'Refuser', style: { background: 'var(--color-error-muted)', color: 'var(--color-error-text)', border: 'var(--color-error)' } }],
  viewed:      [{ targetStatus: 'shortlisted', label: 'Shortlister', style: { background: 'var(--color-success-muted)', color: 'var(--color-success-text)', border: 'var(--color-success)' } }, { targetStatus: 'rejected', label: 'Refuser', style: { background: 'var(--color-error-muted)', color: 'var(--color-error-text)', border: 'var(--color-error)' } }],
  shortlisted: [{ targetStatus: 'accepted', label: 'Accepter', style: { background: '#EDE9FE', color: '#5B21B6', border: '#7C3AED' } }, { targetStatus: 'rejected', label: 'Refuser', style: { background: 'var(--color-error-muted)', color: 'var(--color-error-text)', border: 'var(--color-error)' } }],
}

export function ApplicationStatusActions({
  applicationId,
  status,
  action,
}: {
  applicationId: string
  status: ApplicationStatus
  /** Server action — receives FormData with application_id + status */
  action: (formData: FormData) => Promise<void>
}) {
  const transitions = TRANSITIONS[status]
  if (!transitions) return null

  return (
    <div className="mt-1.5 flex gap-1">
      {transitions.map(({ targetStatus, label, style }) => (
        <form key={targetStatus} action={action}>
          <input type="hidden" name="application_id" value={applicationId} />
          <input type="hidden" name="status" value={targetStatus} />
          <button
            type="submit"
            className="cursor-pointer rounded-md px-2 py-1 font-heading text-[10px] font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--apebi-cyan)]"
            style={{ ...style, border: `1px solid ${style.border}` }}
          >
            {label}
          </button>
        </form>
      ))}
    </div>
  )
}

// Job status badge (utilisé dans la table des offres entreprise)
type JobStatus = 'active' | 'draft' | 'pending' | 'closed' | 'rejected' | string

const JOB_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  active:   { label: 'Active',     bg: 'var(--color-success-muted)', text: 'var(--color-success-text)', border: 'var(--color-success)' },
  draft:    { label: 'Brouillon',  bg: 'var(--apebi-bg-alt)',        text: 'var(--apebi-text-muted)',   border: 'var(--apebi-border)' },
  pending:  { label: 'En attente', bg: 'var(--color-warning-muted)', text: 'var(--color-warning-text)', border: 'var(--color-warning)' },
  closed:   { label: 'Fermée',     bg: 'var(--apebi-bg-alt)',        text: 'var(--apebi-text-muted)',   border: 'var(--apebi-border)' },
  rejected: { label: 'Rejetée',    bg: 'var(--color-error-muted)',   text: 'var(--color-error-text)',   border: 'var(--color-error)' },
}

export function JobStatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  const cfg = JOB_STATUS_CONFIG[status] ?? JOB_STATUS_CONFIG.draft
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 font-heading text-[11px] font-semibold', className)}
      style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  )
}

// Availability badge (talents)
type AvailabilityStatus = 'immediate' | '1month' | '3months' | 'not_available' | 'Immédiate' | '1 mois' | '3 mois' | 'Non disponible' | string | null

const AVAIL_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  // DB values
  immediate:     { label: 'Disponible',       bg: 'var(--color-success-muted)', text: 'var(--color-success-text)' },
  '1month':      { label: 'Dispo dans 1 mois', bg: 'var(--color-warning-muted)', text: 'var(--color-warning-text)' },
  '3months':     { label: 'Dispo dans 3 mois', bg: '#E0F2FE',                   text: '#075985' },
  not_available: { label: 'Non disponible',    bg: 'var(--apebi-bg-alt)',        text: 'var(--apebi-text-muted)' },
  // Legacy string values
  'Immédiate':      { label: 'Disponible',       bg: 'var(--color-success-muted)', text: 'var(--color-success-text)' },
  '1 mois':         { label: 'Dispo dans 1 mois', bg: 'var(--color-warning-muted)', text: 'var(--color-warning-text)' },
  '3 mois':         { label: 'Dispo dans 3 mois', bg: '#E0F2FE',                   text: '#075985' },
  'Non disponible': { label: 'Non disponible',    bg: 'var(--apebi-bg-alt)',        text: 'var(--apebi-text-muted)' },
}

export function AvailabilityBadge({ status, className }: { status: AvailabilityStatus; className?: string }) {
  if (!status) return null
  const cfg = AVAIL_CONFIG[status] ?? AVAIL_CONFIG.not_available
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-heading text-[10px] font-semibold', className)}
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <Clock className="size-2.5 shrink-0" aria-hidden />
      {cfg.label}
    </span>
  )
}
