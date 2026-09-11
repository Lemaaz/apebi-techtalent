# Templates Spec-Driven — index

**Retour :** [`../README.md`](../README.md) · [`../LIFECYCLE.md`](../LIFECYCLE.md)

Ces templates sont **génériques et réutilisables**. Ne les remplissez pas ici : **copiez-les** dans la structure de travail du dépôt et préfixez-les par la date.

```bash
# Exemple : démarrer une PRD pour la messagerie
cp docs/spec-driven-development/templates/2-planning/05-prd.md \
   docs/superpowers/specs/2026-09-11-messagerie-prd.md
```

| Phase | Template | Destination de travail |
|---|---|---|
| **1 · Discovery** | [`1-discovery/01-brainstorming.md`](./1-discovery/01-brainstorming.md) | `docs/superpowers/specs/` |
| | [`1-discovery/02-research.md`](./1-discovery/02-research.md) | `docs/superpowers/specs/` |
| | [`1-discovery/03-product-brief.md`](./1-discovery/03-product-brief.md) | `docs/superpowers/specs/` |
| | [`1-discovery/04-platform-brief.md`](./1-discovery/04-platform-brief.md) | `docs/superpowers/specs/` |
| **2 · Planning** | [`2-planning/05-prd.md`](./2-planning/05-prd.md) | `docs/superpowers/specs/` |
| | [`2-planning/06-ux-ui-design.md`](./2-planning/06-ux-ui-design.md) | `docs/superpowers/specs/` |
| **3 · Solutioning** | [`3-solutioning/07-architecture.md`](./3-solutioning/07-architecture.md) | `docs/superpowers/specs/` |
| | [`3-solutioning/08-epics-and-stories.md`](./3-solutioning/08-epics-and-stories.md) | `docs/superpowers/plans/` |
| | [`3-solutioning/09-test-design.md`](./3-solutioning/09-test-design.md) | `docs/superpowers/specs/` |
| | [`3-solutioning/10-validation.md`](./3-solutioning/10-validation.md) | `docs/superpowers/specs/` |
| **4 · Implementation** | [`4-implementation/11-sprint-plan.md`](./4-implementation/11-sprint-plan.md) | `docs/superpowers/plans/` |
| | [`4-implementation/12-story-loop.md`](./4-implementation/12-story-loop.md) | `docs/superpowers/plans/` |
| | [`4-implementation/13-code-review.md`](./4-implementation/13-code-review.md) | (checklist de PR) |
| | [`4-implementation/14-retrospective.md`](./4-implementation/14-retrospective.md) | `docs/superpowers/retrospectives/` |

**En-tête commun à tout document** (à copier en tête de chaque fichier rempli) :

```markdown
**Date :** YYYY-MM-DD · **Statut :** Draft | En revue | Approuvé | Obsolète
**Auteur·rice :** … · **Phase :** Discovery | Planning | Solutioning | Implementation
**Niveau SDD :** 1 | 2 | 3 · **Spec-pilote :** (lien vers la spec parente, si applicable)
```
