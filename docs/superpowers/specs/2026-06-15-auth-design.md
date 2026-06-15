# Spec — Système d'authentification APEBI TechTalent
**Date :** 2026-06-15  
**Statut :** Approuvé  
**Périmètre :** Connexion, inscription (wizard 2 étapes), réinitialisation mdp, callback Supabase, Navbar auth-aware

---

## 1. Contexte

Les pages `/talent/profil` et `/entreprise/dashboard` redirigent déjà vers `/connexion` via `proxy.ts`, mais la page `/connexion` n'existe pas. Sans auth, rien n'est testable en conditions réelles. Ce bloc débloque toutes les priorités suivantes.

Stack : Next.js 16 App Router · Supabase Auth (`@supabase/ssr`) · Server Actions · Tailwind + shadcn/ui.

---

## 2. Pages et routes

| Route | Type | Rôle |
|---|---|---|
| `/connexion` | Server Component + Server Action | Login email + mot de passe |
| `/inscription` | Client Component (wizard) + Server Action | Inscription 2 étapes |
| `/mot-de-passe-oublie` | Server Component + Server Action | Envoi email de réinitialisation |
| `/auth/callback` | Route Handler (GET) | Échange token Supabase (confirmation + reset) |
| `/auth/update-password` | Client Component + Server Action | Saisie nouveau mot de passe |

---

## 3. Structure de fichiers

```
src/app/
  (auth)/
    layout.tsx                        ← logo cliquable → /, fond muted/30, centré
    connexion/
      page.tsx
      actions.ts                      ← signIn, signOut
    inscription/
      page.tsx                        ← 'use client', wizard 2 étapes
      actions.ts                      ← signUp
    mot-de-passe-oublie/
      page.tsx
      actions.ts                      ← resetPassword
    auth/
      callback/
        route.ts                      ← GET handler
      update-password/
        page.tsx
        actions.ts                    ← updatePassword
```

---

## 4. Layout `(auth)`

- Logo APEBI TechTalent cliquable → `/` (identique au logo du Navbar existant)
- Fond `bg-muted/30`, contenu centré verticalement et horizontalement
- Pas de Navbar ni Footer — focus total sur le formulaire
- Largeur max du card formulaire : `max-w-sm`

---

## 5. Flow Connexion (`/connexion`)

1. Formulaire : champ email + champ mot de passe + bouton "Se connecter"
2. Server Action `signIn(email, password)` → `supabase.auth.signInWithPassword()`
3. **Succès :** lire `user.user_metadata.role` → rediriger vers :
   - `talent` → `/talent/profil`
   - `entreprise` → `/entreprise/dashboard`
   - Si `searchParams.redirect` présent (passé par `proxy.ts`) → utiliser cette URL en priorité
4. **Erreur :** message inline sous le formulaire (credentials invalides, email non confirmé)
5. Liens : "Mot de passe oublié ?" → `/mot-de-passe-oublie` · "Pas encore de compte ?" → `/inscription`

---

## 6. Flow Inscription (`/inscription`) — wizard client

### Étape 1 — Choix du rôle
- Deux cartes cliquables côte à côte :
  - **Talent tech** — icône `UserCircle` — "Je cherche une opportunité dans l'écosystème APEBI"
  - **Entreprise membre** — icône `Building2` — "Je recrute des talents tech pour mon entreprise APEBI"
- Carte sélectionnée : bordure `primary`, fond `primary/5`
- Bouton "Continuer" activé uniquement si un rôle est sélectionné
- Lien "Déjà un compte ?" → `/connexion`

### Étape 2 — Formulaire
- Champs : email + mot de passe (min 8 caractères) + confirmation mot de passe
- Indicateur d'étape (1 / 2) avec bouton retour "← Modifier mon choix"
- Server Action `signUp(email, password, role)` → `supabase.auth.signUp()` avec `options: { data: { role } }`
- **Succès :** page de confirmation inline (pas de redirect) : "Vérifiez votre boîte mail — un lien de confirmation vous a été envoyé."
- **Erreur :** message inline (email déjà utilisé, mots de passe ne correspondent pas, mdp trop court)

### Validation côté client
- Les mots de passe doivent correspondre (vérifié avant soumission)
- Mot de passe ≥ 8 caractères
- Format email validé nativement par `<input type="email">`

---

## 7. Flow Réinitialisation mot de passe

### `/mot-de-passe-oublie`
1. Champ email + bouton "Envoyer le lien"
2. Server Action `resetPassword(email)` → `supabase.auth.resetPasswordForEmail(email, { redirectTo: '<origin>/auth/callback?next=/auth/update-password' })`
3. Succès : message de confirmation inline (pas de redirect)
4. Lien retour → `/connexion`

### `/auth/update-password`
1. Champs : nouveau mot de passe + confirmation (min 8 caractères)
2. Server Action `updatePassword(password)` → `supabase.auth.updateUser({ password })`
3. Succès : redirect → `/connexion?message=password-updated`
4. `/connexion` affiche un bandeau de succès si `message=password-updated` dans les searchParams

---

## 8. Route Handler `/auth/callback`

Route GET qui gère deux cas via le paramètre `type` :

```
GET /auth/callback?token_hash=xxx&type=email&next=/talent/profil
GET /auth/callback?token_hash=xxx&type=recovery&next=/auth/update-password
```

Logique :
1. Extraire `token_hash`, `type`, `next` des searchParams
2. `supabase.auth.verifyOtp({ token_hash, type })`
3. **Succès type `email` (confirmation inscription) :**
   - Lire `user.user_metadata.role`
   - Redirect vers `/talent/profil` ou `/entreprise/dashboard`
4. **Succès type `recovery` (reset mdp) :**
   - Redirect vers `next` (= `/auth/update-password`)
5. **Erreur :** redirect → `/connexion?error=auth-error`

---

## 9. Navbar auth-aware

Le Navbar existant est un Client Component qui affiche toujours "Se connecter / S'inscrire". Il doit devenir auth-aware.

### Approche
- `Navbar` devient un **Server Component** qui lit la session via `createClient()` (server)
- Passe `user` et `role` en props à un nouveau composant `NavbarUserMenu` (Client Component) pour le dropdown interactif
- Le `Navbar` actuel utilise `usePathname` pour les liens actifs — ce hook est client-only. Les liens de navigation sont extraits dans un composant `NavLinks` (`'use client'`) qui conserve `usePathname`. `Navbar` (server) compose `NavLinks` + `NavbarUserMenu`.

### États
| Contexte | Affichage |
|---|---|
| Non connecté | Boutons "Se connecter" + "S'inscrire" (état actuel) |
| Connecté — talent | Avatar initiales + dropdown : "Mon profil", "Déconnexion" |
| Connecté — entreprise | Avatar initiales + dropdown : "Dashboard", "Déconnexion" |

### Déconnexion
- Server Action `signOut()` → `supabase.auth.signOut()` → `redirect('/')`
- Disponible dans le dropdown du `NavbarUserMenu`

---

## 10. Gestion des erreurs et états de chargement

- Tous les formulaires utilisent `useFormStatus` (ou `useActionState`) pour désactiver le bouton pendant la soumission
- Les Server Actions retournent `{ error: string } | { success: true }` — jamais de throw non géré
- Les messages d'erreur Supabase sont traduits en français avant affichage :
  - `Invalid login credentials` → "Email ou mot de passe incorrect"
  - `Email not confirmed` → "Confirmez votre email avant de vous connecter"
  - `User already registered` → "Un compte existe déjà avec cet email"

---

## 11. Hors scope (V1 auth)

- OAuth / connexion LinkedIn (→ V2)
- Authentification à deux facteurs (→ V2)
- Magic link comme méthode de connexion principale (→ V2)
- Gestion des sessions multiples / révocation de tokens
