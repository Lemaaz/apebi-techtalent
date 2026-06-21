'use client'

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1" style={{ background: 'var(--apebi-border)' }} />
      <span className="font-sans text-[11px] uppercase tracking-wide text-muted-foreground">ou</span>
      <div className="h-px flex-1" style={{ background: 'var(--apebi-border)' }} />
    </div>
  )
}
