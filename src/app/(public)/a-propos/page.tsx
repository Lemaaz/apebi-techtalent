import type { Metadata } from 'next'
import Link from 'next/link'
import { Target, Users, Building2, Briefcase, ExternalLink } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'À propos',
  description:
    'APEBI TechTalent est la plateforme officielle de la Fédération APEBI pour connecter les talents tech marocains aux entreprises membres du secteur numérique.',
}

const FEATURES = [
  {
    icon: Building2,
    title: 'Vitrines entreprises',
    description:
      "Chaque entreprise membre APEBI dispose d'une page dédiée pour présenter sa culture, ses valeurs et ses opportunités.",
  },
  {
    icon: Users,
    title: 'Profils talents',
    description:
      "Les professionnels tech marocains créent leur profil, déclarent leurs compétences et se rendent visibles aux recruteurs APEBI.",
  },
  {
    icon: Briefcase,
    title: "Offres d'emploi",
    description:
      'Les entreprises publient leurs offres directement sur la plateforme. Les talents postulent en quelques clics.',
  },
  {
    icon: Target,
    title: 'Matching ciblé',
    description:
      "L'accès aux profils est réservé aux recruteurs APEBI validés, garantissant des connexions de qualité dans l'écosystème.",
  },
]

const STATS = [
  { label: 'Entreprises membres', value: '150+' },
  { label: 'Emplois créés / an', value: '5 000+' },
  { label: 'Milliards MAD de CA', value: '30+' },
  { label: "Ans d'existence", value: '30+' },
]

export default function AProposPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 to-background px-4 py-16 text-center sm:px-6 sm:py-24">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-cyan mask-radial opacity-50" />
          <div className="relative mx-auto max-w-2xl">
            <p className="rise-in mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--apebi-coral)]">
              Commission C5 — APEBI
            </p>
            <h1 className="rise-in font-heading text-3xl font-bold text-foreground sm:text-4xl" style={{ animationDelay: '80ms' }}>
              Le hub RH tech de la Fédération APEBI
            </h1>
            <p className="rise-in mt-4 text-base text-muted-foreground" style={{ animationDelay: '160ms' }}>
              APEBI TechTalent est la concrétisation de l&apos;Axe C (Tech Talent Bridge) de la
              Commission C5. Notre mission : connecter les talents tech marocains aux entreprises
              membres APEBI et accélérer la croissance du secteur numérique au Maroc.
            </p>
            <div className="rise-in mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '240ms' }}>
              <Link href="/entreprises" className={cn(buttonVariants({ size: 'sm' }))}>
                Voir les entreprises
              </Link>
              <Link
                href="/offres"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                Offres d&apos;emploi
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-border bg-muted/30 px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                  <dd className="mt-1 font-heading text-2xl font-bold text-primary">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-10 text-center font-heading text-xl font-bold text-foreground">
              Comment ça marche
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="card-lift rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-glow-soft">
                    <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" aria-hidden />
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* About APEBI */}
        <section className="border-t border-border bg-muted/20 px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 font-heading text-xl font-bold text-foreground">
              La Fédération APEBI
            </h2>
            <p className="text-sm text-muted-foreground">
              L&apos;APEBI (Association des Professionnels des Technologies de l&apos;Information)
              est la fédération des entreprises du secteur numérique au Maroc. Fondée il y a plus
              de 30 ans, elle rassemble plus de 150 entreprises membres et représente un chiffre
              d&apos;affaires agrégé de plus de 30 milliards de dirhams.
            </p>
            <a
              href="https://apebi.org.ma/"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-6 gap-1.5')}
            >
              <ExternalLink className="size-3.5" aria-hidden />
              Site officiel APEBI
            </a>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-14 text-center sm:px-6">
          <div className="mx-auto max-w-xl">
            <h2 className="mb-3 font-heading text-xl font-bold text-foreground">
              Rejoignez l&apos;écosystème
            </h2>
            <p className="mb-8 text-sm text-muted-foreground">
              Talent tech à la recherche d&apos;opportunités ou entreprise APEBI souhaitant
              recruter ? Créez votre espace dès maintenant.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/inscription" className={cn(buttonVariants({ size: 'sm' }))}>
                Créer mon profil talent
              </Link>
              <Link
                href="/entreprises/inscription"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                Inscrire mon entreprise
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
