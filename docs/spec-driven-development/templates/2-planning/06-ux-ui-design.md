# Design UX & UI — <fonctionnalité> *(user-friendly, user-first)*

**Date :** YYYY-MM-DD · **Statut :** Draft · **Phase :** Planning · **Niveau SDD :** 2
**PRD en entrée :** (lien vers `05-prd.md`)

> **But :** décrire *comment l'utilisateur vit* la fonctionnalité. Principe **user-first** : chaque écran existe pour servir un besoin dans un parcours. On ne dessine pas un écran orphelin.

---

## 1. Principes directeurs

- **User-first :** le besoin de l'utilisateur avant l'esthétique.
- **User-friendly :** clair, peu d'étapes, erreurs pardonnables.
- **Bilingue FR/EN** et **accessible** par défaut (contraste, clavier, lecteurs d'écran).
- **Cohérent** avec le design system (`src/components/ui/`, shadcn/ui, Tailwind 4).

## 2. Parcours utilisateur détaillé

> Un parcours = une suite d'écrans reliés à un besoin. Décrire le « happy path » puis les écarts.

### Parcours principal : <nom>
| Étape | Écran/route | Action utilisateur | Résultat attendu |
|---|---|---|---|
| 1 | | | |
| 2 | | | |

### Parcours alternatifs / erreurs
-

## 3. Écrans & états

> Pour chaque écran, lister tous les états. Un écran n'est pas spécifié tant que ses états ne le sont pas.

### Écran : <nom> (`/route`)
- **Objectif :**
- **États :** chargement · vide · rempli · erreur · succès · sans permission
- **Composants réutilisés :**
- **Nouveaux composants :**
- **Wireframe / maquette :** (lien Figma ou description)

## 4. Règles d'interaction

- Validation de formulaire (temps réel / à la soumission) :
- Feedback (toasts Sonner, états de chargement) :
- Navigation & retours :

## 5. Contenu (FR/EN)

| Clé | FR | EN |
|---|---|---|
| | | |

## 6. Accessibilité

- [ ] Navigation clavier complète.
- [ ] Contrastes conformes.
- [ ] Labels & rôles ARIA.
- [ ] Messages d'erreur explicites et associés aux champs.

## 7. Responsive

- Mobile : … · Tablette : … · Desktop : …

## 8. Validation design

- [ ] Chaque écran est relié à un parcours et à une exigence de la PRD.
- [ ] Prêt pour Solutioning (architecture `07`).
