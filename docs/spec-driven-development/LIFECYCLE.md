# Le cycle de vie Spec-Driven — de l'idée au code

**Retour au framework :** [`README.md`](./README.md) · **Voir aussi :** [`MATURITY-LEVELS.md`](./MATURITY-LEVELS.md)

Quatre phases mènent une idée jusqu'au code. Chaque phase **consomme** les sorties de la précédente et **produit** des documents précis, chacun disposant d'un template dans [`templates/`](./templates/).

---

## Vue d'ensemble

| Phase | Question | Documents produits | Template |
|---|---|---|---|
| **1. Discovery** | *Quoi & pourquoi ?* | Brainstorming · Research · Product brief · Platform brief | [`templates/1-discovery/`](./templates/1-discovery/) |
| **2. Planning** | *Quoi, précisément ?* | PRD (spec fonctionnelle + générale) · Design UX/UI (user-first) | [`templates/2-planning/`](./templates/2-planning/) |
| **3. Solutioning** | *Comment ?* | Architecture · Epics & Stories · Test Design · Validation | [`templates/3-solutioning/`](./templates/3-solutioning/) |
| **4. Implementation** | *Faire.* | Sprint plan · Story loop · Code review · Retrospective | [`templates/4-implementation/`](./templates/4-implementation/) |

---

## Phase 1 — Discovery *(Quoi & Pourquoi)*

Objectif : transformer une idée floue en intention partagée et cadrée. On explore, on ne s'engage pas encore.

| Document | Rôle | Entrée | Sortie |
|---|---|---|---|
| **Brainstorming** | Diverger : générer un maximum d'options sans filtre. | Une idée, un problème, un signal utilisateur. | Liste d'options + pistes retenues. |
| **Research** | Réduire l'incertitude : marché, utilisateurs, technique, existant. | Pistes du brainstorming. | Faits, contraintes, risques, benchmark. |
| **Product brief** | Cadrer *une* initiative produit : problème, cible, valeur, succès. | Research + pistes retenues. | Problème + hypothèse de valeur + métriques de succès. |
| **Platform brief** | Cadrer l'impact sur la **plateforme** (transverse) : positionnement, écosystème APEBI, contraintes plateforme. | Product brief. | Contraintes et opportunités plateforme, alignement écosystème. |

**Critère de sortie Discovery :** un product brief + un platform brief validés, avec un problème clair et une hypothèse de valeur mesurable.

---

## Phase 2 — Planning *(Quoi, précisément)*

Objectif : transformer l'intention validée en **spécification**. C'est ici que naît la spec-pilote (Niveau 2).

| Document | Rôle | Entrée | Sortie |
|---|---|---|---|
| **PRD** — spec fonctionnelle & générale | Décrire *ce que* le produit fait : fonctions, règles métier, parcours, exigences non-fonctionnelles. | Product + platform brief. | Spec fonctionnelle complète + critères d'acceptation généraux. |
| **Design UX & UI** — *user-friendly, user-first* | Décrire *comment* l'utilisateur vit le produit : parcours, wireframes, états, accessibilité, i18n FR/EN. | PRD. | Parcours utilisateur, écrans, états, règles d'interaction. |

**Principe user-first :** aucun écran n'est spécifié sans le parcours qui l'amène et le besoin qu'il sert. Le design sert l'utilisateur avant l'esthétique. Bilinguisme FR/EN et accessibilité sont des exigences, pas des options.

**Critère de sortie Planning :** une PRD approuvée + un design UX/UI validé. **C'est la spec-pilote** que l'IA suivra (Niveau 2).

---

## Phase 3 — Solutioning *(Comment)*

Objectif : traduire la spec fonctionnelle en **solution technique découpée et vérifiable**.

| Document | Rôle | Entrée | Sortie |
|---|---|---|---|
| **Architecture** | Décrire *comment* techniquement : structure, données, API, dépendances, décisions (ADR). | PRD + design. | Schéma technique, modèle de données, contrats, décisions justifiées. |
| **Epics & Stories** | Découper en unités livrables et rattachables. | Architecture + PRD. | Épics → stories avec critères d'acceptation, chaque story liée à la spec. |
| **Test Design** | Définir *comment on prouve* que ça marche — **avant** de coder. | Stories + critères d'acceptation. | Plan de tests (unit/e2e), cas nominaux + limites, dérivés des critères. |
| **Validation** | Vérifier la cohérence de l'ensemble avant de lancer l'implémentation. | Tous les documents ci-dessus. | Go/No-Go tracé, écarts résolus. |

**Critère de sortie Solutioning :** architecture validée, backlog de stories prêtes (chacune avec spec + critères + tests conçus), validation Go.

---

## Phase 4 — Implementation *(Faire)*

Objectif : produire le code, story par story, sans jamais rompre le lien à la spec.

| Document | Rôle | Entrée | Sortie |
|---|---|---|---|
| **Sprint plan** | Sélectionner et ordonnancer les stories d'une itération. | Backlog validé. | Objectif de sprint + stories engagées. |
| **Story loop** | Boucle d'exécution d'une story : spec → code → test → revue → merge. | Une story + sa spec-pilote. | Code livré, spec synchronisée, tests verts. |
| **Code review** | Vérifier code **et** cohérence spec↔code. | PR d'une story. | PR approuvée ou corrections. |
| **Retrospective** | Apprendre : ce qui a marché, la dette, la montée en maturité SDD. | Fin de sprint. | Actions d'amélioration + mesure du niveau SDD. |

**La boucle story (Niveau 2), pas à pas :**
1. Localiser la spec-pilote de la story. *Si absente → la créer avant de coder.*
2. Écrire/adapter les tests depuis les critères d'acceptation (Test Design).
3. Implémenter jusqu'à ce que les tests passent.
4. Si le code doit dévier de la spec → **mettre à jour la spec dans la même PR**.
5. Revue : code + sync spec↔code.
6. Merge.

**Critère de sortie Implementation :** stories mergées, tests verts, specs à jour, rétrospective tenue.

---

## Cycle Agile : rappeler les phases à la demande

Les 4 phases **ne sont pas une cascade obligatoire**. Selon la nature du travail, on entre dans le cycle au bon endroit et on ne rejoue que les phases nécessaires.

```
                    ┌───────────────────────── ⟲ retour Discovery si pivot / signal fort
                    │
  Nature du travail │  Point d'entrée
  ──────────────────┼──────────────────────────────────────────────
  Nouveau produit / │  Phase 1 — Discovery (les 4 phases, dans l'ordre)
  gros module       │
  ──────────────────┼──────────────────────────────────────────────
  Nouvelle feature  │  Phase 2 — Planning (PRD légère) → Solutioning → Implementation
  (module existant) │
  ──────────────────┼──────────────────────────────────────────────
  Évolution         │  Phase 3 — Solutioning (mettre à jour archi/stories) → Implementation
  technique         │
  ──────────────────┼──────────────────────────────────────────────
  Bug / correctif   │  Phase 4 — Implementation (micro-story rattachée à la spec existante)
```

### Règles du cycle Agile

1. **Le lien ne se rompt jamais.** Quel que soit le point d'entrée, tout code se rattache à une story, et toute story à une spec (Niveau 2). Un correctif sans spec met à jour la spec existante.
2. **La profondeur s'adapte.** Un correctif ne demande pas une PRD complète — mais il touche la spec concernée. Un gros module demande les 4 phases.
3. **On remonte si nécessaire.** Un retour utilisateur majeur ou un pivot rouvre Discovery, puis on redescend. Le cycle est itératif, pas linéaire.
4. **Chaque itération se clôt par une rétrospective** qui mesure la progression vers le niveau de maturité visé.

### Rattachement au dépôt existant

Les documents produits vivent dans la structure `docs/superpowers/` déjà en place :
- **specs** (brief, research, PRD, design, architecture, test design) → `docs/superpowers/specs/`
- **plans** (epics, sprint, story loop) → `docs/superpowers/plans/`
- **rétrospectives** → `docs/superpowers/retrospectives/`

Les plans existants (`2026-06-15-auth.md`, etc.) sont des artefacts de Phase 3/4 : ils restent valides et deviennent le modèle vivant de cette méthode.

---

*Chaque document ci-dessus a un template prêt à copier dans [`templates/`](./templates/).*
