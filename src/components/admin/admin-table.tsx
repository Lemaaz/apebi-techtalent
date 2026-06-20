import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────

export type AdminTableColumn<T> = {
  /** Clé unique */
  key: string
  /** En-tête affiché */
  header: string
  /** Largeur optionnelle (Tailwind w- class) */
  width?: string
  /** Alignement (défaut: left) */
  align?: 'left' | 'center' | 'right'
  /** Rendu de la cellule */
  cell: (row: T) => React.ReactNode
}

type AdminTableProps<T> = {
  columns: AdminTableColumn<T>[]
  data: T[]
  /** Clé unique par ligne */
  rowKey: (row: T) => string
  /** Slot affiché si data est vide */
  emptyState?: React.ReactNode
  /** Classes additionnelles sur le wrapper */
  className?: string
  /** Colonne des actions — rendu dans la dernière colonne sticky */
  actions?: (row: T) => React.ReactNode
  /** Caption accessible */
  caption?: string
}

// ── Component ────────────────────────────────────────────────

export function AdminTable<T>({
  columns,
  data,
  rowKey,
  emptyState,
  className,
  actions,
  caption,
}: AdminTableProps<T>) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border shadow-[var(--shadow-card)]',
        'border-[var(--apebi-border)] bg-card',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          {caption && (
            <caption className="sr-only">{caption}</caption>
          )}

          {/* ── Header ── */}
          <thead>
            <tr style={{ background: 'var(--apebi-bg-alt)', borderBottom: '2px solid var(--apebi-border)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground',
                    col.width,
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.align === 'left' && 'text-left',
                    !col.align && 'text-left',
                  )}
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th
                  scope="col"
                  className="w-[120px] px-4 py-3 text-right font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  {emptyState ?? (
                    <span className="text-sm text-muted-foreground">Aucune donnée.</span>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <AdminTableRow
                  key={rowKey(row)}
                  row={row}
                  columns={columns}
                  actions={actions}
                  isLast={i === data.length - 1}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Row ──────────────────────────────────────────────────────

function AdminTableRow<T>({
  row,
  columns,
  actions,
  isLast,
}: {
  row: T
  columns: AdminTableColumn<T>[]
  actions?: (row: T) => React.ReactNode
  isLast: boolean
}) {
  return (
    <tr
      className="group transition-colors hover:bg-[var(--apebi-bg-alt)]"
      style={!isLast ? { borderBottom: '1px solid var(--apebi-border)' } : undefined}
    >
      {columns.map((col) => (
        <td
          key={col.key}
          className={cn(
            'px-4 py-3.5 align-middle text-[13px] text-foreground',
            col.align === 'right' && 'text-right',
            col.align === 'center' && 'text-center',
          )}
        >
          {col.cell(row)}
        </td>
      ))}
      {actions && (
        <td className="px-4 py-3.5 text-right align-middle">
          <div className="flex items-center justify-end gap-1.5">
            {actions(row)}
          </div>
        </td>
      )}
    </tr>
  )
}

// ── Inline action button ──────────────────────────────────────

type ActionVariant = 'approve' | 'reject' | 'reset' | 'view' | 'neutral'

const ACTION_STYLES: Record<ActionVariant, string> = {
  approve: 'bg-[var(--color-success)] text-white hover:opacity-90',
  reject:  'border border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error-text)] hover:bg-[var(--color-error)]/20',
  reset:   'border border-[var(--apebi-border)] text-muted-foreground hover:bg-[var(--apebi-bg-alt)]',
  view:    'border border-[var(--apebi-border)] text-muted-foreground hover:bg-[var(--apebi-bg-alt)]',
  neutral: 'bg-[var(--apebi-bg-alt)] text-muted-foreground hover:bg-[var(--apebi-border)]',
}

export function AdminTableAction({
  label,
  variant,
  className,
}: {
  label: string
  variant: ActionVariant
  className?: string
}) {
  return (
    <button
      type="submit"
      className={cn(
        'cursor-pointer rounded-lg px-2.5 py-1.5 font-heading text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apebi-cyan)] focus-visible:ring-offset-1',
        ACTION_STYLES[variant],
        className,
      )}
    >
      {label}
    </button>
  )
}
