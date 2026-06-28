import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment APEBI TechTalent collecte, utilise et protège vos données personnelles.',
}

export default function PolitiqueConfidentialitePage() {
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
            <h1 className="font-heading text-2xl font-bold" style={{ color: 'var(--apebi-text)' }}>Politique de confidentialité</h1>
            <p className="mt-2 font-sans text-sm" style={{ color: 'var(--apebi-text-muted)' }}>Dernière mise à jour : juin 2026</p>
          </div>
        </div>

        <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <div className="legal-content">

            <h2>1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des données personnelles collectées via la plateforme
              APEBI TechTalent est l&apos;<strong>APEBI</strong> (Association des Professionnels des
              Technologies de l&apos;Information), Commission Formation &amp; Tech Talents (C5).
              Contact : <a href="mailto:techtalent@apebi.ma">techtalent@apebi.ma</a>
            </p>

            <h2>2. Données collectées</h2>
            <h3>Pour les talents</h3>
            <ul>
              <li>Identité : nom, prénom, photo de profil</li>
              <li>Coordonnées : adresse email, ville</li>
              <li>Informations professionnelles : titre, compétences, expériences, formations, CV</li>
              <li>Préférences : disponibilité, mode de travail, niveau de séniorité</li>
              <li>Profils publics : URL LinkedIn, GitHub (si renseignés)</li>
            </ul>
            <h3>Pour les entreprises membres</h3>
            <ul>
              <li>Informations société : dénomination, logo, secteur, taille, description</li>
              <li>Contact : email, site web, réseaux sociaux</li>
              <li>Offres d&apos;emploi publiées et candidatures reçues</li>
            </ul>
            <h3>Données techniques</h3>
            <ul>
              <li>Adresse IP, type de navigateur, pages visitées (logs serveur)</li>
              <li>Cookies d&apos;authentification (session Supabase)</li>
            </ul>

            <h2>3. Finalités du traitement</h2>
            <ul>
              <li>Mise en relation entre talents tech et entreprises membres APEBI</li>
              <li>Gestion des comptes et authentification</li>
              <li>Envoi de notifications liées à la plateforme (candidatures, statuts)</li>
              <li>Amélioration des fonctionnalités de la plateforme</li>
              <li>Production de statistiques anonymisées (Observatoire)</li>
            </ul>

            <h2>4. Base légale</h2>
            <p>
              Le traitement est fondé sur le consentement des utilisateurs lors de l&apos;inscription
              et sur l&apos;exécution d&apos;un service à la demande de l&apos;utilisateur (mise en relation).
            </p>

            <h2>5. Destinataires des données</h2>
            <ul>
              <li><strong>Entreprises membres APEBI validées :</strong> peuvent consulter les profils talents visibles</li>
              <li><strong>Supabase :</strong> hébergement base de données (EU West)</li>
              <li><strong>Vercel :</strong> hébergement frontend</li>
              <li><strong>Resend :</strong> envoi d&apos;emails transactionnels</li>
            </ul>
            <p>Nous ne vendons ni ne louons vos données à des tiers.</p>

            <h2>6. Durée de conservation</h2>
            <ul>
              <li><strong>Compte actif :</strong> données conservées pendant toute la durée d&apos;activité du compte</li>
              <li><strong>Après suppression de compte :</strong> données supprimées sous 30 jours</li>
              <li><strong>Candidatures :</strong> conservées 2 ans après la clôture de l&apos;offre</li>
            </ul>

            <h2>7. Vos droits (CNDP)</h2>
            <p>
              Conformément à la loi 09-08 relative à la protection des personnes physiques à l&apos;égard
              du traitement des données à caractère personnel, vous disposez des droits suivants :
            </p>
            <ul>
              <li><strong>Droit d&apos;accès :</strong> obtenir la confirmation que vos données sont traitées et en recevoir une copie</li>
              <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes</li>
              <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement pour des raisons légitimes</li>
              <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données (ou utiliser la fonctionnalité &quot;Supprimer mon compte&quot;)</li>
            </ul>
            <p>
              Pour exercer ces droits : <a href="mailto:techtalent@apebi.ma">techtalent@apebi.ma</a>
            </p>

            <h2>8. Cookies</h2>
            <p>
              La plateforme utilise uniquement des cookies strictement nécessaires au fonctionnement
              du service (cookies de session d&apos;authentification). Aucun cookie de tracking ou
              publicitaire n&apos;est utilisé.
            </p>

            <h2>9. Sécurité</h2>
            <p>
              Vos données sont protégées par des mesures de sécurité appropriées : chiffrement
              des mots de passe, connexions HTTPS, contrôle d&apos;accès via Row Level Security (RLS)
              sur la base de données, authentification via Supabase Auth.
            </p>

            <h2>10. Modifications</h2>
            <p>
              Nous nous réservons le droit de modifier cette politique à tout moment. Toute modification
              substantielle sera notifiée aux utilisateurs par email.
            </p>

            <h2>11. Contact</h2>
            <p>
              Pour toute question relative à cette politique ou à vos données personnelles :
              <br />
              <a href="mailto:techtalent@apebi.ma">techtalent@apebi.ma</a>
              <br />
              Commission Formation &amp; Tech Talents — APEBI, Casablanca, Maroc
            </p>

          </div>

          <div className="mt-10 border-t pt-6" style={{ borderColor: 'var(--apebi-border)' }}>
            <Link
              href="/mentions-legales"
              className="font-heading text-sm font-medium text-[var(--apebi-cyan)] hover:underline"
            >
              → Mentions légales
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
