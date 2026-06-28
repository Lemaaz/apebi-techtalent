import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Informations légales sur la plateforme APEBI TechTalent.',
}

export default function MentionsLegalesPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">

        {/* Hero */}
        <div
          className="border-b px-4 py-10 sm:px-6"
          style={{ background: 'var(--apebi-bg-alt)', borderColor: 'var(--apebi-border)' }}
        >
          <div className="mx-auto max-w-2xl">
            <p className="text-overline mb-2">Légal</p>
            <h1 className="font-heading text-2xl font-bold" style={{ color: 'var(--apebi-text)' }}>Mentions légales</h1>
            <p className="mt-2 font-sans text-sm" style={{ color: 'var(--apebi-text-muted)' }}>Dernière mise à jour : juin 2026</p>
          </div>
        </div>

        <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <div className="legal-content">

            <h2>Éditeur</h2>
            <p>
              La plateforme <strong>APEBI TechTalent</strong> est une initiative de la{' '}
              <strong>Commission Formation &amp; Tech Talents (C5)</strong> de l&apos;
              <strong>Association des Professionnels des Technologies de l&apos;Information (APEBI)</strong>.
            </p>
            <ul>
              <li><strong>Dénomination :</strong> APEBI — Association des Professionnels des Technologies de l&apos;Information</li>
              <li><strong>Siège social :</strong> Casablanca, Maroc</li>
              <li><strong>Contact :</strong>{' '}
                <a href="mailto:techtalent@apebi.ma">techtalent@apebi.ma</a>
              </li>
              <li><strong>Site principal :</strong>{' '}
                <a href="https://www.apebi.ma" target="_blank" rel="noopener noreferrer">www.apebi.ma</a>
              </li>
            </ul>

            <h2>Hébergement</h2>
            <ul>
              <li><strong>Frontend :</strong> Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</li>
              <li><strong>Base de données :</strong> Supabase Inc. — données hébergées dans la région EU West</li>
            </ul>

            <h2>Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des contenus présents sur la plateforme (textes, graphiques, logotypes, icônes,
              images) sont la propriété exclusive de l&apos;APEBI ou de ses membres partenaires, sauf mention contraire.
              Toute reproduction, représentation, modification ou exploitation non autorisée est interdite.
            </p>

            <h2>Responsabilité</h2>
            <p>
              L&apos;APEBI s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur
              cette plateforme, dont elle se réserve le droit de corriger le contenu à tout moment.
              Cependant, l&apos;APEBI ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations
              mises à disposition. En conséquence, l&apos;APEBI décline toute responsabilité pour toute imprécision,
              inexactitude ou omission portant sur des informations disponibles sur ce site.
            </p>
            <p>
              Les offres d&apos;emploi et profils de talents publiés sur la plateforme sont sous la responsabilité
              exclusive des entreprises et talents qui les ont soumis. L&apos;APEBI n&apos;est pas partie aux contrats
              conclus entre les entreprises et les talents.
            </p>

            <h2>Liens hypertextes</h2>
            <p>
              La plateforme peut contenir des liens hypertextes pointant vers d&apos;autres sites web.
              L&apos;APEBI n&apos;exerce aucun contrôle sur ces sites tiers et décline toute responsabilité
              quant à leur contenu.
            </p>

            <h2>Droit applicable</h2>
            <p>
              Les présentes mentions légales sont soumises au droit marocain. En cas de litige,
              les tribunaux compétents sont ceux du ressort du siège social de l&apos;APEBI à Casablanca.
            </p>

            <h2>Contact</h2>
            <p>
              Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à{' '}
              <a href="mailto:techtalent@apebi.ma">techtalent@apebi.ma</a>.
            </p>

          </div>

          <div className="mt-10 border-t pt-6" style={{ borderColor: 'var(--apebi-border)' }}>
            <Link
              href="/politique-confidentialite"
              className="font-heading text-sm font-medium text-[var(--apebi-cyan)] hover:underline"
            >
              → Politique de confidentialité
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
