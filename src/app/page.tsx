import type { Metadata } from 'next'
import Link from 'next/link'
import { Award, Building2, Search, Users, ArrowRight, Check, MapPin, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'APEBI TechTalent — Talents tech & entreprises numériques au Maroc',
}

// ── Data ────────────────────────────────────────────────────────

const STATS = [
  { value: '258+', label: 'entreprises membres' },
  { value: '1 200+', label: 'profils talents' },
  { value: '90+', label: 'offres actives' },
  { value: '45+', label: 'mises en relation / mois' },
] as const

const HOW_IT_WORKS = [
  {
    icon: Building2,
    step: 1,
    title: 'Créez votre vitrine',
    description: 'Présentez votre entreprise et publiez vos offres en quelques minutes.',
  },
  {
    icon: Search,
    step: 2,
    title: 'Trouvez les profils',
    description: 'Accédez à un vivier de talents validés, filtrés par compétences C5.',
  },
  {
    icon: Users,
    step: 3,
    title: 'Connectez-vous',
    description: 'Talents et recruteurs se retrouvent dans un espace sécurisé APEBI.',
  },
] as const

const FEATURED_COMPANIES = [
  {
    initials: 'CI',
    name: 'CloudInfo Maroc',
    sector: 'Cloud & Infrastructure',
    city: 'Casablanca',
    jobs: 3,
    avatarClass: 'bg-primary/10 text-primary',
  },
  {
    initials: 'DX',
    name: 'DataXpert Solutions',
    sector: 'Data & Intelligence',
    city: 'Rabat',
    jobs: 7,
    avatarClass: 'bg-[#3A4652]/10 text-[#3A4652]',
  },
  {
    initials: 'TS',
    name: 'TechSys Digital',
    sector: 'Cybersécurité',
    city: 'Casablanca',
    jobs: 2,
    avatarClass: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    initials: 'AI',
    name: 'AiLabs Maroc',
    sector: 'Intelligence Artificielle',
    city: 'Casablanca',
    jobs: 9,
    avatarClass: 'bg-violet-500/10 text-violet-600',
  },
] as const

// ── Page ────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────── */}
        <section
          aria-labelledby="hero-heading"
          className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="max-w-2xl">
              {/* Badge — inline styles to avoid Base UI hook constraint in RSC */}
              <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Award className="size-3" aria-hidden />
                Plateforme officielle APEBI
              </span>

              <h1
                id="hero-heading"
                className="font-heading text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl"
              >
                Connectez les talents tech aux entreprises qui construisent le{' '}
                <span className="text-primary">Maroc numérique</span>
              </h1>

              <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                La plateforme officielle de l&apos;APEBI pour mettre en relation les entreprises
                membres et les profils tech marocains qualifiés.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/entreprises/inscription"
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'gap-2 px-6 py-2.5 text-sm font-semibold',
                  )}
                >
                  <Building2 className="size-4" aria-hidden />
                  Je cherche un talent
                </Link>
                <Link
                  href="/offres"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'lg' }),
                    'gap-2 px-6 py-2.5 text-sm font-semibold',
                  )}
                >
                  <Search className="size-4" aria-hidden />
                  Je cherche une opportunité
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ─────────────────────────────────── */}
        <section aria-label="Chiffres clés" className="border-b border-border bg-muted/30">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center justify-center px-6 py-8 text-center">
                <dt className="font-heading text-3xl font-bold text-primary">{value}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── How it works ──────────────────────────── */}
        <section aria-labelledby="how-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 id="how-heading" className="font-heading text-xl font-semibold text-foreground">
            Comment ça marche
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, description }) => (
              <Card key={title}>
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="size-6 text-primary" aria-hidden />
                  </div>
                  <p className="mb-1 text-xs font-semibold text-primary">Étape {step}</p>
                  <h3 className="font-heading text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Featured companies ────────────────────── */}
        <section
          aria-labelledby="companies-heading"
          className="border-t border-border bg-muted/30 px-4 py-16 sm:px-6"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <h2
                id="companies-heading"
                className="font-heading text-xl font-semibold text-foreground"
              >
                Entreprises membres en vedette
              </h2>
              <Link
                href="/entreprises"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Voir toutes
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
              {FEATURED_COMPANIES.map(({ initials, name, sector, city, jobs, avatarClass }) => (
                <li key={name}>
                  <Link href={`/entreprises/${name.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Card className="transition-all hover:ring-primary/30">
                      <CardContent className="pt-5">
                        <div className="mb-3 flex items-center gap-3">
                          <div
                            className={cn(
                              'flex size-10 shrink-0 items-center justify-center rounded-lg font-heading text-sm font-semibold',
                              avatarClass,
                            )}
                            aria-hidden
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-heading text-sm font-semibold text-foreground">
                              {name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{sector}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" aria-hidden />
                            {city}
                          </span>
                          <span className="text-xs font-medium text-primary">
                            {jobs} offre{jobs > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-1">
                          <Check className="size-3 text-primary" aria-hidden />
                          <span className="text-xs text-muted-foreground">Membre APEBI</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Bottom CTA ────────────────────────────── */}
        <section
          aria-labelledby="cta-heading"
          className="border-t border-border px-4 py-16 text-center sm:px-6"
          style={{ background: '#212121' }}
        >
          <div className="mx-auto max-w-2xl">
            <h2
              id="cta-heading"
              className="font-heading text-2xl font-bold text-white sm:text-3xl"
            >
              Prêt à rejoindre la communauté ?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Plus de 300 entreprises membres et 1 200 talents vous attendent sur la plateforme
              officielle de l&apos;APEBI.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/entreprises/inscription"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'gap-2 bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90',
                )}
              >
                <Briefcase className="size-4" aria-hidden />
                Inscrire mon entreprise
              </Link>
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Users className="size-4" aria-hidden />
                Créer mon profil talent
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
