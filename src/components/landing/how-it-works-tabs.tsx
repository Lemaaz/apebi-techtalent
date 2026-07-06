'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const RECRUITER_STEPS = [
  {
    step: 1,
    title: 'Créez votre vitrine',
    description: 'Présentez votre entreprise, culture tech et valeurs aux talents qualifiés en quelques minutes.',
  },
  {
    step: 2,
    title: 'Publiez vos offres',
    description: 'Rédigez et publiez vos offres — visibles immédiatement de tous les talents APEBI.',
  },
  {
    step: 3,
    title: 'Sélectionnez les talents',
    description: 'Accédez aux profils validés par l\'équipe APEBI et entrez en contact directement.',
  },
] as const

const TALENT_STEPS = [
  {
    step: 1,
    title: 'Créez votre profil',
    description: 'Import LinkedIn ou formulaire — votre profil est validé par l\'équipe APEBI sous 48h.',
  },
  {
    step: 2,
    title: 'Explorez les offres',
    description: 'Parcourez les offres publiées par les 258+ entreprises membres APEBI.',
  },
  {
    step: 3,
    title: 'Postulez en un clic',
    description: 'Envoyez votre candidature et suivez son avancement depuis votre tableau de bord.',
  },
] as const

export function HowItWorksTabs() {
  const [active, setActive] = useState<'recruiter' | 'talent'>('recruiter')
  const steps = active === 'recruiter' ? RECRUITER_STEPS : TALENT_STEPS

  return (
    <div>
      {/* Tab switcher */}
      <div className="mb-10 flex justify-center">
        <div className="inline-flex rounded-xl border border-[var(--apebi-border)] bg-[var(--apebi-bg-alt)] p-1">
          <button
            type="button"
            onClick={() => setActive('recruiter')}
            className={cn(
              'rounded-lg px-5 py-2.5 text-sm font-medium transition-all',
              active === 'recruiter'
                ? 'bg-[var(--apebi-cyan)] text-white shadow-[var(--shadow-card)]'
                : 'text-[var(--apebi-text-muted)] hover:text-[var(--apebi-text)]',
            )}
          >
            Je recrute
          </button>
          <button
            type="button"
            onClick={() => setActive('talent')}
            className={cn(
              'rounded-lg px-5 py-2.5 text-sm font-medium transition-all',
              active === 'talent'
                ? 'bg-[var(--apebi-cyan)] text-white shadow-[var(--shadow-card)]'
                : 'text-[var(--apebi-text-muted)] hover:text-[var(--apebi-text)]',
            )}
          >
            Je cherche un poste
          </button>
        </div>
      </div>

      {/* Step cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map(({ step, title, description }, index) => (
          <div key={title} className="relative">
            {/* Connector */}
            {index < 2 && (
              <div
                className="absolute left-[calc(50%+44px)] top-9 hidden h-px w-[calc(100%-24px)] bg-gradient-to-r from-[var(--apebi-cyan)]/35 via-[var(--apebi-cyan)]/15 to-transparent sm:block"
                aria-hidden
              />
            )}

            <div className="card-lift group rounded-xl border border-[var(--apebi-border)] bg-white p-6 text-center shadow-[var(--shadow-card)] hover:border-[var(--apebi-cyan)] hover:shadow-[var(--shadow-card-hover)]">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-[var(--apebi-cyan)]/30 bg-[var(--apebi-cyan-muted)] transition-transform duration-300 group-hover:scale-105">
                <span className="font-heading text-lg font-bold text-[var(--apebi-cyan-dark)]">{step}</span>
              </div>
              <h3 className="font-heading text-base font-semibold text-[var(--apebi-text)]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--apebi-text-muted)]">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
