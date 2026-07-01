/**
 * Score APEBI TechTalent Employeur — E7 (CEO review 21/06/2026)
 *
 * Mesure l'engagement d'une entreprise membre APEBI sur la plateforme.
 * Calculé à la volée depuis les données existantes — pas de table dédiée.
 *
 * Niveaux :
 *   0 — Non scoré (profil incomplet)
 *   1 — Membre      : inscrit et validé APEBI
 *   2 — Actif       : profil complet (logo + secteur) + ≥1 offre active
 *   3 — Engagé      : ≥3 offres actives sur la plateforme
 *   4 — Labellisé   : Label APEBI TechTalent obtenu
 */

export type ApebiScoreLevel = 0 | 1 | 2 | 3 | 4

export interface ApebiScoreInput {
  apebi_member_since: string | null | undefined
  has_techtalent_label: boolean
  logo_url: string | null | undefined
  activeJobCount: number
}

export interface ApebiScore {
  level: ApebiScoreLevel
  label: string
  description: string
  color: string
  bgColor: string
}

const LEVELS: Record<ApebiScoreLevel, Omit<ApebiScore, 'level'>> = {
  0: {
    label: 'Profil incomplet',
    description: 'Complétez votre profil pour apparaître dans le score.',
    color: 'text-white/30',
    bgColor: 'bg-white/5',
  },
  1: {
    label: 'Membre APEBI',
    description: 'Entreprise validée par la Commission C5.',
    color: 'text-[var(--apebi-cyan)]',
    bgColor: 'bg-[var(--apebi-cyan)]/10',
  },
  2: {
    label: 'Actif',
    description: 'Profil complet avec au moins une offre active.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  3: {
    label: 'Engagé',
    description: 'Recruteur régulier avec 3 offres actives ou plus.',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
  },
  4: {
    label: 'Labellisé APEBI',
    description: 'Label APEBI TechTalent — excellence en recrutement tech.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
}

export function computeApebiScore(input: ApebiScoreInput): ApebiScore {
  const { apebi_member_since, has_techtalent_label, logo_url, activeJobCount } = input

  // Niveau 4 — Label APEBI TechTalent
  if (has_techtalent_label) {
    return { level: 4, ...LEVELS[4] }
  }

  // Niveau 3 — Engagé (≥3 offres actives)
  if (apebi_member_since && logo_url && activeJobCount >= 3) {
    return { level: 3, ...LEVELS[3] }
  }

  // Niveau 2 — Actif (profil complet + ≥1 offre)
  if (apebi_member_since && logo_url && activeJobCount >= 1) {
    return { level: 2, ...LEVELS[2] }
  }

  // Niveau 1 — Membre validé
  if (apebi_member_since) {
    return { level: 1, ...LEVELS[1] }
  }

  // Niveau 0 — profil incomplet
  return { level: 0, ...LEVELS[0] }
}
