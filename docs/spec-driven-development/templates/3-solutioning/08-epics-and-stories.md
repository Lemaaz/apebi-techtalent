# Epics & Stories — <fonctionnalité>

**Date :** YYYY-MM-DD · **Statut :** Draft · **Phase :** Solutioning · **Niveau SDD :** 2
**Architecture en entrée :** (lien vers `07-architecture.md`)

> **But :** découper la solution en unités livrables et **rattachables à la spec**. Chaque story porte un lien `Spec:` — c'est le fil qui interdit tout code orphelin (Niveau 2).

---

## Épic : <nom>

- **Objectif :** (valeur livrée)
- **PRD source :** (lien)
- **Critère de fin d'épic :**

---

### Stories

> Format : « En tant que <persona>, je veux <action> afin de <bénéfice>. »
> Chaque story est indépendamment livrable, testable, et liée à une spec.

#### Story 1 — <titre>
- **Récit :** En tant que … je veux … afin de …
- **Spec :** `docs/superpowers/specs/YYYY-MM-DD-<sujet>-prd.md` (+ ancre section)
- **Critères d'acceptation :**
  - [ ] Étant donné … quand … alors …
  - [ ] …
- **Test Design :** (lien vers `09-test-design.md` § story 1)
- **Fichiers concernés :** (issus de l'archi)
- **Dépendances :**
- **Estimation :** (S / M / L)

#### Story 2 — <titre>
- **Récit :**
- **Spec :**
- **Critères d'acceptation :**
  - [ ]
- **Test Design :**
- **Dépendances :**
- **Estimation :**

---

## Séquencement

```
Story 1 ─▶ Story 2 ─▶ Story 3
              └▶ Story 4 (parallèle)
```

## Récapitulatif de traçabilité

| Story | Exigence PRD (FR-n) | Spec | Tests conçus | Prête ? |
|---|---|---|---|---|
| 1 | | | | ☐ |
| 2 | | | | ☐ |

> **Règle Niveau 2 :** une story sans lien `Spec:` n'est pas « prête ». Pas de spec → pas de code.
