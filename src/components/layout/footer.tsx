import Link from 'next/link'

const FOOTER_LINKS = [
  { href: '/entreprises', label: 'Entreprises' },
  { href: '/offres', label: 'Offres' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/politique-confidentialite', label: 'Confidentialité' },
  { href: '/mentions-legales', label: 'Mentions légales' },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-heading text-sm font-semibold">
              APEBI <span className="text-primary">Tech</span>Talent
            </span>
          </Link>

          <nav aria-label="Liens du pied de page" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </nav>

          <p className="shrink-0 text-xs text-muted-foreground">
            © {new Date().getFullYear()} APEBI
          </p>
        </div>

        <p className="mt-6 border-t border-border pt-5 text-center text-xs text-muted-foreground">
          Commission C5 — Formation &amp; Talents · Plateforme officielle de l&apos;APEBI
        </p>
      </div>
    </footer>
  )
}
