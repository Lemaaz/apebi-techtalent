# Code Review — checklist de PR (Spec-Driven)

**Phase :** Implementation · **Niveau SDD :** 2
**À copier dans la description de PR, ou à utiliser comme grille de revue.**

> **But :** la revue vérifie le code **et** la cohérence spec↔code. Une PR peut être parfaite techniquement et refusée si elle diverge de la spec sans mettre la spec à jour. C'est ce qui distingue une revue Spec-Driven d'une revue classique.

---

## PR : <titre> — Story <#>
- **Spec-pilote :** `______`
- **Stories couvertes :** `______`

## 1. Alignement à la spec *(spécifique SDD — priorité 1)*

- [ ] La PR met en œuvre **exactement** ce que décrit la spec-pilote (ni plus, ni moins).
- [ ] Tout écart code↔spec est **reflété dans la spec, dans cette même PR**.
- [ ] Chaque critère d'acceptation de la/les story·s est satisfait.
- [ ] Aucun code « orphelin » (non rattaché à une story/spec).

## 2. Tests

- [ ] Tests dérivés des critères présents et verts (`pnpm test`, `pnpm test:e2e`).
- [ ] Cas limites et erreurs couverts.
- [ ] Permissions/RLS testées par rôle.

## 3. Correction & qualité

- [ ] Logique correcte, pas de régression évidente.
- [ ] Validation serveur (Zod) sur toutes les entrées.
- [ ] Gestion d'erreurs et états (chargement/vide/erreur) présents.
- [ ] Pas de duplication : réutilise l'existant (`src/components/ui/`, lib partagée).

## 4. Conventions plateforme

- [ ] Next.js 16 : APIs conformes (cf. `node_modules/next/dist/docs/`, `AGENTS.md`).
- [ ] Server Components / Server Actions utilisés correctement.
- [ ] i18n FR/EN complète (pas de texte en dur).
- [ ] Accessibilité (clavier, ARIA, contraste).

## 5. Données & sécurité

- [ ] Migration versionnée si schéma modifié (`supabase/migrations/`).
- [ ] Dérive DB vérifiée (`supabase db pull`).
- [ ] RLS/policies en place, pas de fuite de données par rôle.
- [ ] Aucun secret en dur.

## 6. Livraison

- [ ] Lint OK (`pnpm lint`), build OK.
- [ ] Preview Vercel validée.

## Verdict

- [ ] ✅ Approuvée
- [ ] 🔁 Changements demandés : …
- [ ] ⛔ Bloquée (divergence spec non résolue) : …
