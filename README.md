# APEBI TechTalent

Plateforme tech bilingue (FR/EN) de l'écosystème APEBI : vitrine marque employeur des entreprises membres, vivier de talents tech marocains, et mise en relation. Concrétisation digitale de l'Axe C (Tech Talent Bridge) de la Commission sectorielle Formation & Talent (C5) de l'APEBI.

**Production :** https://techtalent-apebi.vercel.app
**Statut :** déployée (~95%), non lancée publiquement. Avancement et prochaines étapes → `../TODOS.md` et `../ROADMAP_NEXT.md`.

## Stack

- **Next.js 16** (App Router) + **React 19** + TypeScript
- **Supabase** (PostgreSQL + Auth + Storage + Realtime) — projet prod `lpubaknjsyslmgyipsrd`
- **Vercel** (hébergement + CI/CD)
- **Tailwind CSS 4** + shadcn/ui
- **Resend** (emails transactionnels)
- **Claude Haiku** (matching IA bidirectionnel, `/api/matching/`)
- Auth : email/password + Google OAuth (actif) + LinkedIn OAuth (code prêt, attend App Review)

> ⚠️ Cette version de Next.js comporte des breaking changes vs les versions antérieures. Lire `node_modules/next/dist/docs/` avant d'écrire du code (cf `AGENTS.md`).

## Démarrage

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Variables d'environnement requises (voir `../INTEGRATIONS.md` pour le détail) :

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
ANTHROPIC_API_KEY=
# LinkedIn (quand App Review approuvée) :
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
```

## Base de données

Migrations versionnées dans `supabase/migrations/` (`001`–`017`, nommage séquentiel).

> ⚠️ **Dérive connue** : la DB prod est en avance sur les migrations du repo (certains correctifs appliqués hors-migration). Exécuter `supabase db pull` pour resynchroniser l'historique avant tout nouveau développement schéma.

Tests RLS : `supabase/tests/` (ex. `017_is_admin_regression.sql`).

## Tests

```bash
pnpm test:e2e     # Playwright (7 specs : auth, admin, recruteur, label, offres, inscription, candidature)
```

## Structure

Application Next.js App Router. Documentation produit/technique complète dans le dossier parent `Talent-Pool-Apebi/` (commencer par `../CLAUDE.md`).

---

*Commission C5 APEBI — APEBI TechTalent*
