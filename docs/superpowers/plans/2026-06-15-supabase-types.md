# Supabase Setup & TypeScript Types — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Appliquer les migrations Supabase, régénérer les types TypeScript auto-générés, et supprimer le cast `any` dans `toggleVisibility`.

**Architecture:** Les migrations SQL existent dans `supabase/migrations/`. Il faut les pousser vers le projet Supabase live, puis régénérer `src/types/database.ts` depuis le schéma réel avec la CLI Supabase. Les pages existantes utilisent des types manuels incomplets qui bloquent l'inférence TypeScript correcte.

**Tech Stack:** Supabase CLI · `@supabase/ssr` · TypeScript

---

## File Map

**Modified files:**
```
src/types/database.ts              ← remplacé par les types auto-générés
src/app/talent/profil/actions.ts   ← suppression du cast `any`
```

---

## Task 1: Appliquer les migrations au projet Supabase

**Files:** aucun fichier à modifier — opération CLI

- [ ] **Step 1.1 — Installer la CLI Supabase**

```bash
npm install -g supabase
```

Vérifier l'installation :

```bash
supabase --version
```

Expected output : `1.x.x` ou supérieur.

- [ ] **Step 1.2 — Se connecter et lier le projet**

Récupérer le `Project ID` depuis le dashboard Supabase : Settings → General → Reference ID (format : `abcdefghijklmnop`).

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Entrer le mot de passe de la base de données quand demandé.

- [ ] **Step 1.3 — Pousser les migrations**

```bash
supabase db push
```

Expected output :
```
Applying migration 001_init_schema.sql...
Applying migration 002_seed_domains_skills.sql...
Applying migration 003_rls_policies.sql...
Finished supabase db push.
```

Si erreur `already exists`, les tables existent déjà — c'est OK grâce aux `IF NOT EXISTS`.

- [ ] **Step 1.4 — Vérifier dans le Dashboard**

Ouvrir Supabase Dashboard → Table Editor. Vérifier la présence de :
- `domains` (6 lignes attendues après seed)
- `skills` (plusieurs dizaines)
- `talent_profiles`, `company_profiles`, `job_postings`, `applications`

---

## Task 2: Régénérer les types TypeScript

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 2.1 — Générer les types depuis le schéma live**

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.ts
```

Expected output : le fichier `src/types/database.ts` est remplacé par ~300-400 lignes de types générés automatiquement, avec un header `export type Json = ...` et des interfaces `Database`, `Tables`, etc.

- [ ] **Step 2.2 — Vérifier la structure générée**

Ouvrir `src/types/database.ts`. Vérifier la présence de :

```ts
export type Database = {
  public: {
    Tables: {
      talent_profiles: {
        Row: { id: string; user_id: string; first_name: string; ... }
        Insert: { user_id: string; first_name: string; last_name: string; ... }
        Update: { id?: string; first_name?: string; ... }
      }
      // ...
    }
  }
}
```

- [ ] **Step 2.3 — Vérifier que les clients Supabase utilisent le type**

Ouvrir `src/lib/supabase/server.ts` et `src/lib/supabase/client.ts`. Les deux importent `Database` :

```ts
import type { Database } from '@/types/database'
// ...
return createServerClient<Database>(...)
```

Ce pattern est déjà en place — aucune modification nécessaire. Le changement du fichier `database.ts` se propage automatiquement.

- [ ] **Step 2.4 — Vérifier TypeScript**

```bash
node "node_modules\typescript\bin\tsc" --noEmit
```

Expected output : aucune erreur. Si des erreurs apparaissent sur des propriétés qui n'existent plus dans les types régénérés, les corriger une par une (elles seront liées à des noms de colonnes différents entre les types manuels et le schéma réel).

---

## Task 3: Supprimer le cast `any` dans `toggleVisibility`

**Files:**
- Modify: `src/app/talent/profil/actions.ts`

- [ ] **Step 3.1 — Remplacer le cast `any`**

Remplacer le contenu de `src/app/talent/profil/actions.ts` par :

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function toggleVisibility(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const current = formData.get('current') === 'true'

  await supabase
    .from('talent_profiles')
    .update({ visibility: !current })
    .eq('user_id', user.id)

  revalidatePath('/talent/profil')
}
```

- [ ] **Step 3.2 — Vérifier TypeScript**

```bash
node "node_modules\typescript\bin\tsc" --noEmit
```

Expected output : aucune erreur.

- [ ] **Step 3.3 — Commit**

```bash
git add src/types/database.ts src/app/talent/profil/actions.ts
git commit -m "feat(db): apply migrations, regenerate TypeScript types, remove any cast"
```
