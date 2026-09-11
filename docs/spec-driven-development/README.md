# Spec-Driven Development — Framework APEBI TechTalent

**Statut :** Actif · **Version :** 1.0 · **Dernière mise à jour :** 2026-09-11

> **En une phrase :** sur APEBI TechTalent, la spécification n'est pas un document que l'on écrit *avant* de coder puis que l'on oublie — c'est la **source de vérité** qui pilote l'IA, encadre la revue, et se maintient tout au long de la vie du produit. Le code est une projection de la spec, pas l'inverse.

Ce dossier définit **comment** nous passons de l'idée au code sur cette plateforme. Il répond à un problème réel : *« nous avons avancé dans le développement sans finaliser la méthode Spec-Driven Development »*. Voici la méthode.

---

## Pourquoi ce framework

Le développement assisté par IA échoue quand l'IA improvise. Il réussit quand elle exécute une intention explicite, vérifiable et versionnée. La spec est le contrat entre l'intention humaine et l'exécution machine.

Trois bénéfices concrets :

1. **Traçabilité** — chaque ligne de code se rattache à une story, chaque story à une épic, chaque épic à une PRD, chaque PRD à un product brief. On sait *pourquoi* le code existe.
2. **Rejouabilité** — l'IA (ou un nouvel arrivant) peut reconstruire ou étendre une fonctionnalité à partir de la spec seule.
3. **Revue en amont** — on corrige une intention floue dans un document (coût : minutes) plutôt qu'un bug dans du code livré (coût : heures + régressions).

---

## Les 3 niveaux de maturité

Le framework se déploie en **3 niveaux progressifs**. On ne saute pas de niveau : chaque fonctionnalité, chaque équipe monte en maturité. Détail complet → [`MATURITY-LEVELS.md`](./MATURITY-LEVELS.md).

| Niveau | Nom | Rôle de la spec | Rôle de l'humain | Rôle de l'IA |
|---|---|---|---|---|
| **1** | **Spec-first** *(guidance)* | Ligne directrice. Sert de **revue de code pour l'IA avant de coder** — l'IA lit la spec pour s'en inspirer. | Écrit et code. | Assiste, s'inspire de la spec. |
| **2** | **Spec-anchored** *(pilote)* | **Pilote** le développement. Maintenue pendant toute la construction du projet. | Valide la spec, arbitre. | **Ne code jamais sans la spec-pilote.** |
| **3** | **Spec as source** *(spec = code)* | **Est** la source. Le code est compilé/généré à partir d'elle. | N'est plus dans la boucle de code — **suivi de spec uniquement**. | Compile la spec en code vérifié. |

**Position actuelle du projet :** Niveau 1 → 2 en transition. Objectif de ce framework : ancrer le Niveau 2 sur toutes les nouvelles fonctionnalités.

---

## Le cycle de vie : de l'idée au code

Quatre phases séquentielles, chacune produisant des documents précis. Détail et enchaînement → [`LIFECYCLE.md`](./LIFECYCLE.md).

```
   💡 IDÉE
     │
     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  1. DISCOVERY   │──▶│  2. PLANNING    │──▶│ 3. SOLUTIONING  │──▶│4. IMPLEMENTATION│──▶ 💻 CODE
│                 │   │                 │   │                 │   │                 │
│ • Brainstorming │   │ • PRD           │   │ • Architecture  │   │ • Sprint plan   │
│ • Research      │   │  (fonctionnel + │   │ • Epics&Stories │   │ • Story loop    │
│ • Product brief │   │   général)      │   │ • Test Design   │   │ • Code review   │
│ • Platform brief│   │ • Design UX/UI  │   │ • Validation    │   │ • Retrospective │
│                 │   │  (user-first)   │   │                 │   │                 │
└─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘
     Quoi & Pourquoi     Quoi précisément      Comment                Faire

                         ⟳  Chaque phase est rappelable dans le cycle Agile quand nécessaire
```

Chaque phase dispose d'un **template prêt à remplir** dans [`templates/`](./templates/).

---

## Le cycle Agile : phases à la demande

Les 4 phases ne sont pas un tunnel en cascade. Dans un cycle Agile (sprint, itération, correctif), **on rappelle uniquement les phases nécessaires** :

- **Nouveau produit / gros module** → les 4 phases dans l'ordre.
- **Nouvelle fonctionnalité dans un module existant** → on saute Discovery, on démarre à Planning (PRD légère) ou Solutioning.
- **Bug / correctif** → directement une micro-story (Implementation), rattachée à la spec existante.
- **Pivot / retour utilisateur majeur** → retour en Discovery, puis re-descente.

La règle d'or : **aucun code n'est écrit sans qu'une story le rattache à une spec** (Niveau 2). La profondeur de la spec s'adapte à la taille du changement, mais le lien ne se rompt jamais.

Détail des points d'entrée Agile → [`LIFECYCLE.md § Cycle Agile`](./LIFECYCLE.md#cycle-agile--rappeler-les-phases-à-la-demande).

---

## Comment utiliser ce dossier

1. **Je démarre une fonctionnalité ?** → Lis [`LIFECYCLE.md`](./LIFECYCLE.md), identifie ton point d'entrée Agile.
2. **J'ai besoin d'un document ?** → Copie le template correspondant depuis [`templates/`](./templates/) vers `docs/superpowers/specs/` (specs) ou `docs/superpowers/plans/` (plans d'implémentation), en le préfixant par la date : `YYYY-MM-DD-<sujet>.md`.
3. **Je veux savoir jusqu'où pousser la rigueur ?** → Lis [`MATURITY-LEVELS.md`](./MATURITY-LEVELS.md) et les critères de promotion.
4. **Je suis une IA (Claude Code) ?** → Avant de coder, tu **dois** localiser la spec-pilote de la story. Si elle n'existe pas, tu la crées à partir du template avant d'écrire du code (Niveau 2).

---

## Convention de nommage & emplacements

| Type de document | Emplacement | Nommage |
|---|---|---|
| Brief, research, PRD, design, architecture, test design (specs) | `docs/superpowers/specs/` | `YYYY-MM-DD-<sujet>-<type>.md` |
| Plans d'implémentation (epics, sprint, story loop) | `docs/superpowers/plans/` | `YYYY-MM-DD-<sujet>.md` |
| Rétrospectives | `docs/superpowers/retrospectives/` | `YYYY-MM-DD-<sprint>.md` |
| Templates (ce dossier, ne pas éditer pour un cas réel) | `docs/spec-driven-development/templates/` | `NN-<nom>.md` |

> Les templates de ce dossier sont **génériques et réutilisables**. On ne les remplit pas ici : on les copie dans `docs/superpowers/`.

---

## Index

- [`MATURITY-LEVELS.md`](./MATURITY-LEVELS.md) — les 3 niveaux détaillés + critères de promotion + rôles IA/humain.
- [`LIFECYCLE.md`](./LIFECYCLE.md) — les 4 phases, leurs entrées/sorties, et le cycle Agile.
- [`templates/`](./templates/) — un template par document, organisés par phase.

---

*Framework Spec-Driven Development — APEBI TechTalent · Commission Formation & Talents Tech APEBI*
