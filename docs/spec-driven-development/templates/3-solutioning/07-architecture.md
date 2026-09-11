# Architecture — <fonctionnalité>

**Date :** YYYY-MM-DD · **Statut :** Draft · **Phase :** Solutioning · **Niveau SDD :** 2→3
**PRD & Design en entrée :** (liens vers `05-prd.md`, `06-ux-ui-design.md`)

> **But :** décrire *comment* techniquement. À mesure qu'on formalise contrats et schémas, ce document devient la source des types/schémas (chemin vers Niveau 3).
>
> ⚠️ Next.js 16 comporte des breaking changes — consulter `node_modules/next/dist/docs/` avant de figer des choix (cf. `AGENTS.md`).

---

## 1. Vue d'ensemble

> Schéma ou description de la solution : couches, flux de données, responsabilités.

```
(diagramme ou arborescence)
```

## 2. Structure de fichiers

```
src/app/…
src/components/…
src/lib/…
```
- **Nouveaux fichiers :**
- **Fichiers modifiés :**

## 3. Modèle de données (technique)

- **Tables / colonnes :**
- **Migration :** `supabase/migrations/NNN-<nom>.sql`
- **RLS / policies :**
- ⚠️ Vérifier la dérive DB : `supabase db pull` avant d'écrire la migration.

## 4. Contrats (source des types — vers Niveau 3)

- **Schémas Zod v4 :** (formulaires, entrées Server Actions)
- **Types Supabase générés :** (`supabase gen types`)
- **Contrats d'API / Route Handlers :** entrées, sorties, erreurs.

## 5. Server Actions / API

| Action / route | Entrée | Sortie | Effets | Permission |
|---|---|---|---|---|
| | | | | |

## 6. Intégrations

- Matching IA (Claude / `/api/matching/`) :
- Resend (emails) :
- OAuth (Google actif / LinkedIn en attente) :

## 7. Décisions d'architecture (ADR)

| # | Décision | Alternatives écartées | Justification |
|---|---|---|---|
| ADR-1 | | | |

## 8. Non-fonctionnel

- Performance (SSR/RSC, cache, requêtes) :
- Sécurité (RLS, validation serveur, secrets) :
- Observabilité / logs :

## 9. Impacts & migration

- Rétrocompatibilité :
- Plan de déploiement (Vercel) :

## 10. Validation

- [ ] Cohérent avec PRD et design.
- [ ] Contrats prêts à dériver en tests (`09-test-design.md`).
- [ ] Prêt pour découpage en epics & stories (`08`).
