import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'pending' | 'approved' | 'rejected' | string

const CONFIG: Record<string, { label: string; labelFem: string; className: string; icon: React.ElementType }> = {
  pending:  { label: 'En attente', labelFem: 'En attente', className: 'badge-pending',  icon: Clock },
  approved: { label: 'Validé',     labelFem: 'Validée',    className: 'badge-approved', icon: CheckCircle },
  rejected: { label: 'Refusé',     labelFem: 'Refusée',    className: 'badge-rejected', icon: XCircle },
}

type AdminStatusBadgeProps = {
  status: Status
  /** Accorder au féminin (entreprise) */
  feminine?: boolean
  /** Masquer l'icône */
  noIcon?: boolean
  className?: string
}

export function AdminStatusBadge({ status, feminine = false, noIcon = false, className }: AdminStatusBadgeProps) {
  const cfg = CONFIG[status] ?? {
    label: status,
    labelFem: status,
    className: 'badge-contract',
    icon: Clock,
  }
  const Icon = cfg.icon
  const label = feminine ? cfg.labelFem : cfg.label

  return (
    <span className={cn(cfg.className, className)}>
      {!noIcon && <Icon className="size-3 shrink-0" aria-hidden />}
      {label}
    </span>
  )
}
