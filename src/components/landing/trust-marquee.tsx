const SECTORS = [
  'IT & Digital',
  'Télécommunications',
  'Offshoring',
  'Cybersécurité',
  'Cloud & Data',
  'Fintech',
]

export function TrustMarquee() {
  const items = [...SECTORS, ...SECTORS]

  return (
    <section
      aria-hidden
      className="overflow-hidden border-y border-[var(--apebi-border)] bg-[var(--apebi-bg-alt)] py-5"
    >
      <div className="marquee-track flex w-max">
        {items.map((label, i) => (
          <div
            key={`${label}-${i}`}
            className="flex items-center gap-2 whitespace-nowrap border-r border-[var(--apebi-border)] px-7"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-[var(--apebi-cyan)]" />
            <span className="font-heading text-[13px] font-medium text-[var(--apebi-text-muted)]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
