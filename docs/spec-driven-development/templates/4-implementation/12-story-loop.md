# Story Loop — Story <#> : <titre>

**Date :** YYYY-MM-DD · **Statut :** En cours · **Phase :** Implementation · **Niveau SDD :** 2
**Spec-pilote :** `docs/superpowers/specs/YYYY-MM-DD-<sujet>-prd.md` **← obligatoire**

> **But :** exécuter *une* story de bout en bout sans jamais rompre le lien à la spec. C'est ici que le Niveau 2 se joue concrètement, à chaque story.

---

## La boucle (dans l'ordre, sans sauter d'étape)

### ⓪ Ancrage spec *(bloquant)*
- [ ] Spec-pilote localisée : `______`
- [ ] **Si aucune spec n'existe → la créer depuis un template AVANT de coder.** Ne pas coder à l'aveugle.
- [ ] Critères d'acceptation relus.

### ① Tests d'abord
- [ ] Tests dérivés des critères (cf. `09-test-design.md`) écrits/adaptés.
- [ ] Ils échouent (rouge) pour la bonne raison.

### ② Implémenter
- [ ] Code écrit **strictement** selon la spec.
- [ ] Respect des conventions (Next.js 16, Server Actions, Zod v4, i18n FR/EN).
- [ ] Tests au vert.

### ③ Synchroniser la spec *(si dérive)*
- [ ] Le code a dû dévier ? → **mettre à jour la spec dans la même PR**, ou s'arrêter et demander arbitrage.
- [ ] Spec ↔ code cohérents.

### ④ Revue
- [ ] Auto-revue via `13-code-review.md`.
- [ ] PR ouverte, revue humaine/IA passée.

### ⑤ Merge & clôture
- [ ] CI verte (lint, build, tests).
- [ ] Preview Vercel validée.
- [ ] Story cochée dans `11-sprint-plan.md`.

---

## Journal de la story

| Date | Événement | Décision / écart |
|---|---|---|
| | | |

## Écarts spec↔code (traçés)

| Écart constaté | Cause | Résolution (spec mise à jour ?) |
|---|---|---|
| | | |

## Definition of Done (story)

- [ ] Critères d'acceptation tous vérifiés par des tests verts.
- [ ] Spec-pilote synchronisée.
- [ ] i18n + permissions vérifiées.
- [ ] Mergée.
