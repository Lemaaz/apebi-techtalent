# Les 3 niveaux de maturité Spec-Driven

**Retour au framework :** [`README.md`](./README.md)

Le Spec-Driven Development se déploie en trois niveaux. Chacun décrit **le rôle de la spec, de l'humain et de l'IA**, et **quand** on considère qu'une fonctionnalité (ou l'équipe entière) est prête à monter d'un cran.

Ces niveaux sont cumulatifs : le Niveau 3 contient tout le Niveau 2, qui contient tout le Niveau 1.

---

## Niveau 1 — Spec-first *(la spec comme guidance)*

**Principe :** la spec est une **ligne directrice**. Elle est écrite avant le code et sert de **revue de code anticipée pour l'IA** : avant de générer, l'IA lit la spec pour s'en inspirer et cadrer son intention. La spec guide, mais ne bloque pas.

### Rôles

| Acteur | Rôle |
|---|---|
| **Humain** | Écrit la spec, puis code (avec l'aide de l'IA). Reste le pilote. |
| **IA** | Lit la spec en amont, s'en inspire, propose du code aligné. Assistante. |
| **Spec** | Référence consultative. Peut diverger du code livré sans blocage formel. |

### Ce qui existe à ce niveau
- Un brief ou une PRD légère avant les gros chantiers.
- La spec sert de brief d'entrée pour l'IA (« code review avant de coder »).
- La spec n'est pas systématiquement mise à jour après coup.

### Limite
La spec et le code **divergent** avec le temps (cf. la « dérive DB connue » du README projet). La spec devient de la documentation morte.

### Critères pour passer au Niveau 2
- [ ] Chaque nouvelle fonctionnalité démarre par une spec, sans exception.
- [ ] Les specs sont versionnées dans le repo (`docs/superpowers/specs/`).
- [ ] L'équipe accepte que « pas de spec = pas de code ».

---

## Niveau 2 — Spec-anchored *(la spec-pilote)*

**Principe :** la spec **pilote** le développement. Elle est **maintenue pendant toute la construction du projet** — pas seulement au démarrage. L'IA **ne code jamais sans se rattacher à une spec-pilote** ; si la spec change, le code suit, et si le code doit dévier, on met à jour la spec d'abord.

### Rôles

| Acteur | Rôle |
|---|---|
| **Humain** | Rédige et **valide** la spec, arbitre les écarts, approuve les changements de spec. Ne micro-gère plus le code. |
| **IA** | Implémente **strictement** à partir de la spec-pilote. Refuse (ou signale) toute demande de code non couverte par une spec. Propose des mises à jour de spec quand la réalité l'exige. |
| **Spec** | **Source de vérité vivante.** Synchronisée avec le code en continu. Un écart spec↔code est un défaut à corriger. |

### Ce qui existe à ce niveau
- Chaque story pointe vers une spec (`Spec: docs/superpowers/specs/....md`).
- La spec est mise à jour dans la **même PR** que le code qui la modifie (« docs maintenance during the all project building »).
- La revue de PR vérifie la cohérence spec↔code, pas seulement le code.
- L'IA (Claude Code) localise la spec-pilote avant toute génération ; à défaut, elle la crée.

### Règle IA opérationnelle (Niveau 2)
> Avant d'écrire du code, l'agent **doit** :
> 1. Identifier la story et sa spec-pilote.
> 2. Si aucune spec n'existe → créer la spec à partir du template avant de coder.
> 3. Si le code diverge de la spec → mettre à jour la spec dans la même PR, ou s'arrêter et demander arbitrage.

### Critères pour passer au Niveau 3
- [ ] Zéro divergence spec↔code tolérée sur le périmètre concerné (vérifié en CI ou revue).
- [ ] Les specs sont assez précises et structurées pour être **exécutables** (contrats, schémas, critères d'acceptation formels).
- [ ] Les tests sont dérivés de la spec (Test Design → tests), pas écrits après coup.
- [ ] Un générateur/compilateur (scaffolding, codegen, types Supabase, etc.) peut consommer la spec.

---

## Niveau 3 — Spec as source *(la spec est le code)*

**Principe :** la spec **est** la source. Le code est **compilé/généré** à partir d'elle et vérifié automatiquement. L'humain n'est **plus dans la boucle d'écriture de code** : il fait du **suivi de spec** (revue d'intention, arbitrage produit), et la compilation produit le code.

### Rôles

| Acteur | Rôle |
|---|---|
| **Humain** | **Suivi de spec uniquement.** Écrit/valide l'intention, revoit les specs. Ne relit plus le code ligne à ligne. |
| **IA** | **Compile la spec en code** vérifié par les tests dérivés de la spec. Boucle génération → vérification → correction autonome. |
| **Spec** | **Le programme lui-même**, à un niveau d'abstraction supérieur. Le code est un artefact de build. |

### Ce qui existe à ce niveau
- La spec contient des contrats formels : schémas de données, contrats d'API (types/Zod), critères d'acceptation exécutables (tests Playwright/Vitest dérivés).
- Un pipeline transforme la spec → code + tests → build vérifié.
- Une modification de fonctionnalité = une modification de spec ; le code se régénère.
- Le suivi humain porte sur *quoi* et *pourquoi*, jamais sur *comment*.

### Prérequis techniques sur APEBI TechTalent
- Types Supabase générés depuis le schéma (déjà partiellement en place : `supabase gen types`).
- Contrats d'API et de formulaires exprimés en Zod v4 (déjà utilisé) — la spec devient la source des schémas Zod.
- Suite de tests dérivée des critères d'acceptation (Playwright e2e + Vitest).
- CI qui échoue si code et spec divergent.

### Réalité
Le Niveau 3 est un **cap directeur**, atteint fonctionnalité par fonctionnalité (ex. : génération des types DB, scaffolding CRUD depuis une spec de ressource). Il n'est pas « tout ou rien » à l'échelle de la plateforme.

---

## Tableau de synthèse

| Dimension | Niveau 1 · Spec-first | Niveau 2 · Spec-anchored | Niveau 3 · Spec as source |
|---|---|---|---|
| La spec est… | une inspiration | le pilote | la source |
| L'IA code… | avec la spec en tête | **seulement** depuis la spec | **en compilant** la spec |
| L'humain… | écrit + code | valide + arbitre | suit la spec |
| Sync spec↔code | best effort | obligatoire, même PR | automatique (build) |
| Tests | après le code | dérivés en parallèle | dérivés de la spec, bloquants |
| Divergence tolérée | oui | non | impossible par construction |

---

## Comment progresser concrètement

1. **Aujourd'hui (N1→N2)** : imposer « pas de story sans spec » ; mettre à jour la spec dans la PR du code ; ajouter un champ `Spec:` à chaque story.
2. **Ensuite (N2→N3, par fonctionnalité)** : formaliser les critères d'acceptation en tests ; générer types et schémas depuis la spec ; ajouter une vérification CI de cohérence.
3. **Mesure** : suivre le % de fonctionnalités à chaque niveau dans la rétrospective de sprint.

---

*Voir aussi : [`LIFECYCLE.md`](./LIFECYCLE.md) pour les phases qui produisent ces specs.*
