# Validation — <fonctionnalité> *(Go / No-Go avant implémentation)*

**Date :** YYYY-MM-DD · **Statut :** Draft · **Phase :** Solutioning · **Niveau SDD :** 2
**Documents en entrée :** PRD, Design, Architecture, Epics & Stories, Test Design.

> **But :** vérifier la **cohérence de bout en bout** avant de lancer l'implémentation. Une divergence détectée ici coûte des minutes ; détectée en prod, des heures. C'est la porte de sortie de Solutioning.

---

## 1. Checklist de cohérence

| Vérification | OK ? | Note |
|---|---|---|
| Chaque exigence PRD (FR-n) est couverte par ≥1 story | ☐ | |
| Chaque story a un lien `Spec:` valide | ☐ | |
| Chaque critère d'acceptation a ≥1 test conçu | ☐ | |
| L'architecture couvre toutes les stories | ☐ | |
| Le design couvre tous les écrans/états des parcours | ☐ | |
| i18n FR/EN prévue partout | ☐ | |
| Permissions/RLS spécifiées par rôle | ☐ | |
| Migration DB vérifiée vs dérive (`supabase db pull`) | ☐ | |
| Non-fonctionnel (perf/sécu/a11y) adressé | ☐ | |

## 2. Traçabilité complète

> Le fil doit être ininterrompu : Brief → PRD → Story → Spec → Test → (Code).

| Exigence | Story | Spec | Test | Trou ? |
|---|---|---|---|---|
| FR-1 | | | | |
| FR-2 | | | | |

## 3. Risques résiduels

| Risque | Sévérité | Action avant Go |
|---|---|---|
| | | |

## 4. Écarts détectés & résolution

| Écart | Document(s) | Résolution | Résolu ? |
|---|---|---|---|
| | | | ☐ |

## 5. Décision

- **Niveau SDD visé pour l'implémentation :** 2 | 3
- [ ] **GO** — backlog prêt, on planifie le sprint (`11-sprint-plan.md`).
- [ ] **GO conditionnel** — conditions : …
- [ ] **NO-GO** — retour phase : … · raison : …

**Validé par :** … · **Date :** …
