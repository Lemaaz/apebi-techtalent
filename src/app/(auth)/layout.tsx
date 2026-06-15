import Link from 'next/link'

const LOGO_COLORS = [
  '#00AFD2', '#EF4444', '#F59E0B',
  '#10B981', '#8B5CF6', '#00AFD2',
  '#F59E0B', '#00AFD2', '#EF4444',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <header className="px-4 py-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div aria-hidden className="grid h-7 w-7 grid-cols-3 gap-[2px]">
            {LOGO_COLORS.map((c, i) => (
              <span key={i} className="rounded-[2px]" style={{ background: c }} />
            ))}
          </div>
          <span className="font-heading text-sm font-semibold">
            APEBI <span className="text-primary">Tech</span>Talent
          </span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  )
}
