# Platform Brief — <initiative>

**Date :** YYYY-MM-DD · **Statut :** Draft · **Phase :** Discovery · **Niveau SDD :** 1
**Product brief en entrée :** (lien vers `03-product-brief.md`)

> **But :** cadrer l'impact **plateforme** (transverse) d'une initiative produit. Là où le product brief regarde *une* fonctionnalité, le platform brief regarde l'ensemble : cohérence, dette, écosystème, effets de bord.

---

## 1. Positionnement dans la plateforme

> Où s'insère l'initiative dans APEBI TechTalent (vitrine marque employeur / vivier de talents / mise en relation / matching IA / label).

- Modules impactés :
- Parcours transverses touchés :

## 2. Impact sur l'architecture existante

- **Données / schéma Supabase :** (nouvelles tables ? RLS ? migration ?)
- **Auth & rôles :** (talent / entreprise / admin — impacts permissions ?)
- **API & intégrations :** (matching Claude, Resend, OAuth…)
- **i18n FR/EN :** implications de contenu bilingue.

## 3. Cohérence & réutilisation

- Composants/design system réutilisables : (`src/components/ui/`, shared…)
- Conventions à respecter (App Router, Server Actions, Zod v4…).
- Ce qui ne doit **pas** être dupliqué.

## 4. Effets de bord & risques plateforme

| Zone | Effet possible | Mitigation |
|---|---|---|
| Performance | | |
| Sécurité / RLS | | |
| Dette / migrations | | |
| Expérience globale | | |

## 5. Contraintes plateforme

- **Techniques :** Next.js 16 (breaking changes — cf. `AGENTS.md`), Vercel, Supabase.
- **Dérive DB connue :** vérifier `supabase db pull` avant tout travail schéma.
- **Non-fonctionnel :** perf, accessibilité, SEO, sécurité.

## 6. Alignement écosystème APEBI

> Cohérence avec la Commission Formation & Talents Tech et les autres axes.

## 7. Décision

- [ ] **Go** → Planning (PRD `05-prd.md`).
- [ ] **Conditions à lever d'abord :** …
