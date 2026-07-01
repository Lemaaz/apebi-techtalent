import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, XCircle, Bell, BellOff } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Désabonnement alertes',
}

type SearchParams = Promise<{ success?: string; error?: string }>

export default async function UnsubscribePage({ searchParams }: { searchParams: SearchParams }) {
  const { success, error } = await searchParams

  if (success === '1') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle className="size-7 text-emerald-600" aria-hidden />
        </div>
        <h1 className="mt-5 font-heading text-xl font-bold text-foreground">
          Désabonnement confirmé
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Vous ne recevrez plus d'alertes email pour les nouvelles offres. Vous pouvez réactiver les alertes à tout moment depuis vos paramètres.
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          <Link
            href="/talent/parametres"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--apebi-cyan)] px-5 py-2.5 font-heading text-[13px] font-semibold text-white hover:bg-[var(--apebi-cyan-dark)]"
          >
            <Bell className="size-3.5" aria-hidden />
            Gérer mes préférences
          </Link>
          <Link
            href="/offres"
            className="text-[13px] text-muted-foreground hover:text-foreground"
          >
            Voir les offres →
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-red-50">
          <XCircle className="size-7 text-red-500" aria-hidden />
        </div>
        <h1 className="mt-5 font-heading text-xl font-bold text-foreground">
          Lien invalide
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Ce lien de désabonnement est invalide ou expiré. Connectez-vous pour gérer vos préférences.
        </p>
        <Link
          href="/connexion"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-[var(--apebi-cyan)] px-5 py-2.5 font-heading text-[13px] font-semibold text-white hover:bg-[var(--apebi-cyan-dark)]"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  // Default — direct access (no params)
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-[var(--apebi-cyan)]/10">
        <BellOff className="size-7 text-[var(--apebi-cyan)]" aria-hidden />
      </div>
      <h1 className="mt-5 font-heading text-xl font-bold text-foreground">
        Alertes offres APEBI TechTalent
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Gérez vos préférences d'alertes email depuis vos paramètres de compte.
      </p>
      <Link
        href="/talent/parametres"
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-[var(--apebi-cyan)] px-5 py-2.5 font-heading text-[13px] font-semibold text-white hover:bg-[var(--apebi-cyan-dark)]"
      >
        Mes paramètres
      </Link>
    </div>
  )
}
