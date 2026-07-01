import Image from 'next/image'
import Link from 'next/link'

const PLATFORM_LINKS = [
  { href: '/entreprises', label: 'Entreprises membres' },
  { href: '/offres', label: 'Offres d\'emploi' },
  { href: '/observatoire', label: 'Observatoire' },
  { href: '/formation', label: 'Formation' },
  { href: '/a-propos', label: 'À propos' },
]

const LEGAL_LINKS = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/politique-confidentialite', label: 'Politique de confidentialité' },
]

const ACCOUNT_LINKS = [
  { href: '/connexion', label: 'Connexion' },
  { href: '/inscription', label: 'Inscription talent' },
  { href: '/entreprise/inscription', label: 'Espace entreprise' },
]

// Footer TOUJOURS dark (#212121) + logo light — règle design system §1 & §7.7
export function Footer() {
  return (
    <footer style={{ background: '#212121', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">

        {/* Main columns */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
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
            <p className="mt-4 font-sans text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              La plateforme officielle de recrutement tech de l&apos;écosystème APEBI.
            </p>
            <p className="mt-4 font-sans text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Commission Formation &amp; Tech Talents
            </p>
            <a
              href="mailto:techtalent@apebi.ma"
              className="mt-1 block font-sans text-[12px] transition-colors hover:text-white"
              style={{ color: 'var(--apebi-cyan)' }}
            >
              techtalent@apebi.ma
            </a>
          </div>

          {/* Plateforme */}
          <div>
            <h3 className="mb-4 font-heading text-[12px] font-semibold uppercase tracking-widest text-white/45">
              Plateforme
            </h3>
            <ul className="space-y-3">
              {PLATFORM_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-sans text-[13px] transition-colors hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Mon espace */}
          <div>
            <h3 className="mb-4 font-heading text-[12px] font-semibold uppercase tracking-widest text-white/45">
              Mon espace
            </h3>
            <ul className="space-y-3">
              {ACCOUNT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-sans text-[13px] transition-colors hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="mb-4 font-heading text-[12px] font-semibold uppercase tracking-widest text-white/45">
              Légal
            </h3>
            <ul className="space-y-3">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-sans text-[13px] transition-colors hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <p
              className="mt-8 font-sans text-[11px]"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Données hébergées au Maroc
              <br />
              Conformité CNDP
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <p className="font-sans text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} APEBI · Tous droits réservés
          </p>
          <p className="font-sans text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Plateforme réservée aux membres APEBI et talents tech marocains
          </p>
        </div>
      </div>
    </footer>
  )
}

