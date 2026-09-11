# Test Design — <fonctionnalité>

**Date :** YYYY-MM-DD · **Statut :** Draft · **Phase :** Solutioning · **Niveau SDD :** 2→3
**Stories & critères en entrée :** (lien vers `08-epics-and-stories.md`)

> **But :** définir *comment on prouve* que ça marche — **avant** de coder. Les tests sont **dérivés des critères d'acceptation**, pas écrits après coup. Au Niveau 3, ces cas deviennent la vérification bloquante de la compilation spec→code.
>
> Stack de test : **Vitest** (unitaire) · **Playwright** (e2e, `pnpm test:e2e`) · tests RLS SQL (`supabase/tests/`).

---

## 1. Stratégie

| Niveau de test | Portée | Outil |
|---|---|---|
| Unitaire | logique métier, validations Zod, utilitaires | Vitest |
| Intégration | Server Actions, Route Handlers, DB/RLS | Vitest / SQL |
| E2E | parcours utilisateur bout-en-bout | Playwright |

## 2. Cas de test par story

### Story 1 — <titre>
> Un cas par critère d'acceptation, + limites et erreurs.

| ID | Critère d'acceptation (PRD/story) | Type | Cas nominal | Cas limite / erreur |
|---|---|---|---|---|
| T1.1 | | E2E | Étant donné … quand … alors … | |
| T1.2 | | Unit | | |

### Story 2 — <titre>
| ID | Critère | Type | Nominal | Limite/erreur |
|---|---|---|---|---|
| T2.1 | | | | |

## 3. Tests de permissions (par rôle)

| Scénario | Talent | Entreprise | Admin | Anonyme |
|---|---|---|---|---|
| Accès à … | ✅/❌ | | | |
| Action … | | | | |

## 4. Données de test

- Fixtures / seeds nécessaires :
- Comptes de test par rôle :

## 5. Couverture i18n

- [ ] Parcours vérifié en FR et en EN.

## 6. Definition of tested

- [ ] Chaque critère d'acceptation a au moins un test.
- [ ] Cas limites et erreurs couverts.
- [ ] Permissions vérifiées par rôle.
- [ ] Suite exécutable en CI.

## 7. Traçabilité

| Test | Story | Critère | Fichier de test cible |
|---|---|---|---|
| T1.1 | 1 | | `e2e/…spec.ts` |
