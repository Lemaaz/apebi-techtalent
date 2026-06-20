import Image from 'next/image'
import Link from 'next/link'

const FOOTER_LINKS = [
  { href: '/entreprises', label: 'Entreprises' },
  { href: '/offres', label: 'Offres' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/politique-confidentialite', label: 'Confidentialité' },
  { href: '/mentions-legales', label: 'Mentions légales' },
]

// Footer TOUJOURS dark (#212121) + logo light — règle design system §1 & §7.7
export function Footer() {
  return (
    <footer style={{ background: '#212121', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">

          {/* Logo light APEBI */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="rounded px-2 py-0.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <Image
                src="/apebi-logo.png"
                alt="APEBI"
                width={80}
                height={22}
                className="h-[22px] w-auto object-contain brightness-0 invert"
                style={{ width: 'auto' }}
              />
            </div>
            <span className="font-heading text-sm font-semibold">
              <span style={{ color: 'var(--apebi-cyan)' }}>Tech</span>
              <span className="text-white">Talent</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav aria-label="Liens du pied de page" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="font-sans text-xs text-white/55 transition-colors hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>

          <p className="shrink-0 font-sans text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            © {new Date().getFullYear()} APEBI
          </p>
        </div>

        <p
          className="mt-6 border-t pt-5 text-center font-sans text-xs"
          style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}
        >
          Commission C5 — Formation &amp; Talents · Plateforme officielle de l&apos;APEBI
        </p>
      </div>
    </footer>
  )
}
