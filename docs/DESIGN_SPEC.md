# DESIGN_SPEC.md — APEBI TechTalent

**Statut : spec-anchored.** Ce document est la référence de design pilote du projet, au sens du niveau 2 de la méthodologie spec-driven (spec-first → **spec-anchored** → spec-as-source). Il est extrait exhaustivement des mockups `.dc.html` du projet Claude Design **« Apebi Tech Talent redesign »** (`claude.ai/design/p/42753851-874e-4eee-a8d9-e04a4b9a0234`), qui restent la spec-as-source pour tout ce qui touche au visuel.

## Règle pour tout agent IA (humain ou Claude) avant de coder une page

1. **Lire ce document avant de toucher au code d'une page publique/marketing.** Ne pas coder de mémoire, ne pas improviser une variante « proche ».
2. **Si ce document et le `.dc.html` correspondant divergent**, le `.dc.html` fait foi — mettre à jour ce document plutôt que de trancher au jugé.
3. **Ne jamais déclarer une page « terminée »** sans avoir coché chaque item de la checklist de fidélité en fin de section de page.
4. **Ce qui n'est PAS dans ce document n'est pas une exigence de design** — ne pas ajouter d'effets/animations inventés. Les mockups sont volontairement sobres par endroits ; ne pas « enrichir ».
5. **Données fictives du mockup ≠ spec produit.** Les mockups contiennent des données statiques (`companies`, `jobs`, `applications`, témoignages placeholder) à but illustratif uniquement. La donnée réelle vient de Supabase. Ne jamais coder en dur les données du mockup dans le produit.
6. **Section « Écarts déjà actés »** (fin de doc) : liste les divergences volontaires entre mockup et produit, décidées consciemment (pas des oublis). Un agent qui voit une différence doit d'abord vérifier cette section avant de la traiter comme un bug de fidélité.

---

## 1. Design tokens (source de vérité : `src/app/globals.css`)

Le mockup utilise des hex bruts ; le produit les a déjà tokenisés (F3, batches 1–4). **Toujours coder avec les tokens ci-dessous, jamais avec le hex brut du mockup.**

### Couleurs de marque
| Token CSS | Valeur | Usage mockup |
|---|---|---|
| `--apebi-cyan` | `#00AFD2` | Couleur primaire — CTA, liens actifs, accents |
| `--apebi-cyan-dark` | `#0096B5` | Hover des CTA cyan |
| `--apebi-cyan-light` | `#E6F7FB` | Fond badges numérotés clairs |
| `--apebi-cyan-muted` | `rgba(0,175,210,0.12)` | Fond badges/pills cyan doux |
| `--apebi-coral` | `#F4785B` | Accent chaud — eyebrows de section uniquement (règle F6 : *eyebrows = corail, actions/marque = cyan*) |
| `--apebi-dark-90` | `#0F0F0F` | Fond hero, navbar scrolled-top, sections sombres, footer institutionnel |
| `--apebi-navy` | `#3A4652` | Badges secteur sur fond clair |
| `--apebi-text` | `#202020` | Texte principal |
| `--apebi-text-muted` | `#545454` | Texte secondaire / paragraphes |
| `--apebi-text-light` | `#797979` | Texte tertiaire / métadonnées |
| `--apebi-border` | `#EAEAEA` | Bordures cartes/inputs |
| `--apebi-bg-alt` | `#F5F5F5` | Fond de section alterné |
| `--apebi-bg-admin` | `#F8F8F8` | Fond des vues app (dashboard, profil) |

### Couleurs sémantiques (statuts)
| Token | Valeur fond | Valeur texte | Usage |
|---|---|---|---|
| success | `#D1FAE5` | `#065F46` | Statut « Active », « Disponible », badge profil validé |
| warning | `#FEF3C7` | `#92400E` | Statut « En validation », « Dispo 1 mois » |
| error | `#FEE2E2` | `#991B1B` | Statut « Refusée » |
| info | `#E6F7FB` | `#0E6E85` | Statut « Nouvelle », liens secondaires (`#0E6E85`) |

### Typographie
- **Titres** : Poppins, poids 500/600/700(/800 sur le hero landing) — `font-heading` dans le produit.
- **Corps** : Hind, poids 400/500/600 — `font-sans` dans le produit.
- Le mockup importe ces deux polices via Google Fonts ; le produit doit servir l'équivalent via `next/font`.

### Rayons, ombres
Déjà couverts par `--radius-*` et `--shadow-*` dans `globals.css` — cohérents avec le mockup (`border-radius: 8–14px` sections, `999px` pills/avatars).

---

## 2. Bibliothèque d'animations/effets (canonique)

Chaque effet du mockup a un nom, une définition exacte, et son statut d'implémentation actuel. **`respecte prefers-reduced-motion` est obligatoire pour toute nouvelle animation.**

| Nom mockup | Définition exacte (mockup) | Classe produit | Statut |
|---|---|---|---|
| `riseIn` | `opacity:0→1, translateY(22px→0)`, `0.7s ease`, délais échelonnés par élément (0/100/200/300/400ms) | `.rise-in` (`0.75s cubic-bezier(0.22,1,0.36,1)`) | ✅ Implémenté (durée/easing légèrement adaptés — acceptable) |
| `pulseDot` | `opacity:0.55↔1, scale:1↔1.3`, `infinite` | `.node-pulse` (`3.2s ease-in-out infinite`) | ✅ Implémenté |
| `floatSlow` | `translateY(0↔-10px)`, `infinite` | `.float-slow` (`7s ease-in-out infinite`) | ✅ Implémenté |
| `marqueeScroll` | `translateX(0→-50%)`, liste dupliquée x2, `32s linear infinite` | `.marquee-track` | ✅ Implémenté (`TrustMarquee`) |
| `gradientShift` | Texte hero dégradé cyan, `background-size:200% auto`, `background-position` anime `0%→100%→0%`, `6s ease infinite` | `.text-gradient-cyan` | ❌ **MANQUANT — dégradé actuellement statique.** Voir gap #1. |
| Canvas réseau animé (hero) | 42 nœuds avec vélocité propre, rebond sur les bords, lignes de connexion redessinées chaque frame selon distance (`requestAnimationFrame`), rendu `<canvas>` | `NetworkGraph` (SVG statique, 5 nœuds fixes en `node-pulse`) | ❌ **DÉGRADÉ — perte de la dynamique vivante du réseau.** Voir gap #2. |
| Reveal au scroll (`data-reveal`) | Chaque section (stats, comment ça marche, entreprises, institutionnel, témoignages, CTA final) commence à `opacity:0, translateY(24px)` et transitionne à `opacity:1, translateY(0)` (`0.7s ease`) quand elle entre dans le viewport, via `IntersectionObserver({threshold:0.12})`, une seule fois (`unobserve` après trigger) | — | ❌ **ABSENT — aucune section hors hero n'anime au scroll.** Voir gap #3. |
| `shineSweep` (bouton CTA) | *Non présent dans le mockup Landing* — ajout produit ultérieur (glissement de lueur au hover sur `btn-shine`) | `.btn-shine` | ➕ Ajout produit, hors spec mockup — à conserver (amélioration, pas une dérive) |
| `auroraDrift` | *Non présent tel quel dans le mockup* — les lueurs radiales du hero (`radial-gradient`) sont statiques dans le mockup | `.aurora` / `.aurora-drift` | ➕ Ajout produit — acceptable, cohérent avec l'esprit ambiant du mockup |
| Burger menu mobile (Landing) | 3 barres → transforment en X (`rotate(45deg)` / `opacity:0` / `rotate(-45deg)`), overlay plein écran fond `#0F0F0F` qui slide/apparaît, liens en cascade | `MobileMenu` (à vérifier) | ⚠️ À vérifier — voir gap #4 |
| Navbar scroll transition | `background`/`border-color` transitionnent de transparent-sur-dark à blanc-sur-clair après `scrollY > 40`, `0.3s ease` | — | ⚠️ À vérifier sur la page produit (le mockup Landing gère ça en JS interne ; le produit a une navbar fixe blanche partout) — **écart potentiellement volontaire**, à trancher (voir « Écarts à trancher ») |

### Détail technique — reveal au scroll (à ré-implémenter)
```js
// Mockup : IntersectionObserver sur chaque <section data-reveal="1">
this.revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      this.revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
```
Base CSS : `opacity:0; transform:translateY(24px); transition:opacity 0.7s ease, transform 0.7s ease;`
Sections concernées sur Landing : Stats, Comment ça marche, Entreprises en vedette, Institutionnel, Témoignages, CTA final (toutes sauf Hero et Trust marquee).

### Détail technique — dégradé animé du titre
```css
background: linear-gradient(90deg, #00AFD2, #5EE8FF, #00AFD2);
background-size: 200% auto;
-webkit-background-clip: text; background-clip: text; color: transparent;
animation: gradientShift 6s ease infinite;
@keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
```

---

## 3. Composants partagés

### Navbar publique (fond clair — Offres, Entreprises, Formation, OffreDetail, VitrineEntreprise)
`sticky top:0`, fond `#FFFFFF`, `border-bottom:1px solid #EAEAEA`, hauteur de padding `14px 24px`. Logo APEBI (fond blanc, radius 6px) + wordmark « **Tech**Talent » (Tech en cyan). Nav desktop centrée avec item actif souligné (`border-bottom:2px solid cyan`). Droite : lien Connexion texte + bouton « Rejoindre » plein cyan.

### Navbar landing (fond sombre → transition au scroll)
Identique en structure, mais démarre transparente sur `#0F0F0F`, texte blanc, et **transitionne vers fond blanc/texte sombre après `scrollY > 40px`** (voir tableau animations). Menu burger mobile en dessous de 880px.

### Navbar app (DashboardRecruteur, ProfilTalent)
Fond blanc fixe (non transitionnant), item actif souligné, cloche de notification (point rouge si non-lu), avatar rond avec initiales.

### Footer
Deux variantes : **footer complet** (Landing — 4 colonnes : marque, Plateforme, Mon espace, Légal + bas de page mentions) et **footer compact** (pages secondaires — logo + 3 liens + copyright sur une ligne). Fond `#212121` dans les deux cas.

### Cartes (pattern commun)
`border:1px solid #EAEAEA; border-radius:12–14px; padding:22–28px`, hover : `border-color:cyan; box-shadow:0 4px 16px rgba(0,175,210,0.15)`, transition `0.2s ease`. Utilisé pour : cartes entreprise (grid Entreprises), cartes offre (grid Offres), cartes formation, sections de contenu (OffreDetail, VitrineEntreprise, ProfilTalent).

### Chips de filtre (secteur/contrat/domaine)
Pill `border-radius:999px`, padding `9px 16px`, état actif : `background:cyan; color:white`, inactif : `background:white; border:1.5px solid #EAEAEA; color:#545454`. Transition `all 0.2s ease`.

### Placeholders « logo entreprise » / « bannière »
Le mockup utilise systématiquement un cadre en pointillés (`border:1.5px dashed #D8D8D8`) avec un label monospace gris (`logo`, `logo école`, `bannière entreprise — image à fournir`) pour tout visuel non encore fourni. **Le produit doit reproduire ce pattern de placeholder** pour les entreprises sans logo/bannière uploadé — ne pas laisser de case vide ou d'icône générique non signalée.

### Tabs pill (Comment ça marche / Connexion Login-Signup)
Conteneur `background:#F5F5F5, border-radius:11px, padding:5px, gap:4px`. Bouton actif : `background:white, box-shadow:0 2px 8px rgba(0,0,0,0.08), color:#0E6E85`. Inactif : transparent, `color:#797979`.

### Toggle (visibilité profil, ProfilTalent)
Switch `46×26px`, knob `20×20px` qui coulisse `left:3px↔23px`, `transition:left 0.2s ease` sur le knob et `background 0.2s ease` sur le rail. Rail actif `cyan`, inactif `#D8D8D8`.

---

## 4. Spec par page

### 4.1 Landing (`/`)
- **Hero** : fond `#0F0F0F`, canvas réseau animé en fond (overlay `opacity:0.9`) + 2 lueurs radiales statiques (cyan haut-gauche, navy bas-droite). Eyebrow « La fédération du numérique marocain » (cyan). H1 avec dégradé animé sur « Maroc numérique ». Sous-titre. 2 CTA (plein cyan « Je cherche un talent » / outline « Je cherche une opportunité »). Avatars empilés + compteur entreprises.
- **Trust marquee** : bande grise défilante infinie, 6 secteurs dupliqués x2, séparateurs verticaux.
- **Stats** : 4 colonnes bordées, `data-reveal`.
- **Comment ça marche** : tabs Talent/Entreprise, `data-reveal`, 3 étapes numérotées par tab.
- **Entreprises en vedette** : grid 4 colonnes, `data-reveal`, cartes avec placeholder logo + secteur + badge « Membre APEBI validé ».
- **Institutionnel** : fond sombre, 2 colonnes (texte + stats C5 / liste de badges), `data-reveal`.
- **Témoignages** : 3 slots placeholder (dashed border) — **volontairement non implémentés en prod** (pas de vraies données), voir Écarts actés.
- **CTA final** : dégradé sombre `135deg #0F0F0F→#16232A`, `data-reveal`.
- **Footer complet.**

**Checklist fidélité Landing** :
- [x] Structure de sections identique
- [x] Palette identique (tokenisée)
- [x] `rise-in` hero
- [x] Dégradé animé sur « Maroc numérique » (gap #1 — corrigé 12/07/2026, `gradient-shift` sur `.text-gradient-cyan`)
- [x] Mouvement continu sur le graphe réseau (gap #2 — corrigé 12/07/2026 : dérive CSS des nœuds + pulsation des lignes, plutôt qu'une réécriture canvas — voir note ci-dessous)
- [x] Reveal au scroll sur les 5 sections hors hero (gap #3 — corrigé 12/07/2026, composant `ScrollReveal` client + `IntersectionObserver`)
- [ ] Navbar transition scroll dark→light (à vérifier, gap potentiel — non traité dans ce lot)
- [ ] Burger menu mobile fonctionnel avec overlay plein écran (gap #4, à vérifier — non traité dans ce lot)

> **Note sur le gap #2** : le produit remplace le canvas générique à particules du mockup par un SVG affichant les hubs de domaines nommés (DEV BACKEND, DATA SCIENCE, CYBER SECURITY, CLOUD INFRA) autour d'un nœud central APEBI TechTalent — une info-design plus riche que la décoration d'ambiance du mockup. Plutôt que de revenir à un canvas générique, la dynamique manquante (dérive des nœuds, pulsation des connexions) a été ajoutée en CSS pur sur cette structure existante. Traité comme un **écart acté**, pas un gap restant.

### 4.2 Connexion / Inscription (`/connexion`, `/inscription`)
Layout 2 colonnes `0.9fr / 1.1fr`. **Gauche** : panneau sombre `#0F0F0F` avec lueurs radiales statiques, logo, H1 « Rejoignez l'écosystème tech officiel du Maroc », liste de 3 bullets (losange cyan `rotate(45deg)`), mention légale en bas. **Droite** : formulaire sur fond blanc, tabs pill Connexion/Inscription, si Inscription → sélecteur de rôle (2 cartes Talent/Entreprise), champs email/mot de passe (bouton afficher/masquer), lien mot de passe oublié (login only), CTA submit, séparateur « ou continuer avec », boutons Google/LinkedIn (présents dans le mockup — **non implémentés en prod, à trancher**, voir Écarts à trancher), mentions légales en pied.

### 4.3 Offres (`/offres`)
Header clair, recherche + chips de filtre par contrat (Tous/CDI/CDD/Stage/Freelance). Grid de cartes offre (logo placeholder, titre lien, chips contrat/ville/séniorité, description tronquée, domaine + CTA Postuler). Compteur de résultats dynamique au-dessus de la grille.

### 4.4 Détail offre (`/offres/[slug]`)
Fond `#F5F5F5`. Fil « ← Retour aux offres ». Carte header : logo + titre + lien entreprise + CTA Postuler/Sauvegarder + chips (contrat, ville, télétravail, séniorité, fourchette salariale en vert). Layout 2 colonnes : gauche = Description / Missions (liste à puces losange) / Compétences (chips cyan) ; droite (sticky) = Conditions (liste clé-valeur), carte Entreprise (logo + secteur + CTA vitrine), carte CTA sombre « Ce poste vous correspond ? ».

### 4.5 Entreprises (`/entreprises`)
Header clair + recherche + chips secteur. Grid de cartes entreprise (logo placeholder, nom, badge secteur, ville, offres actives, badge « Membre APEBI validé »). CTA final sombre « Votre entreprise est membre APEBI ? ».

### 4.6 Vitrine entreprise (`/entreprises/[slug]`)
Bannière dégradé sombre en pleine largeur (`120deg #0F0F0F→#16232A→#1E4D5C`) avec placeholder image. Carte identité qui chevauche la bannière (`margin-top:-56px`) : logo, nom + badges (Membre APEBI, Label TechTalent), métadonnées (secteur, villes, taille, ancienneté), CTA Postuler spontanément + Site web. 2 colonnes : gauche = À propos + Offres actives (liste de lignes cliquables) ; droite (sticky) = Informations clé-valeur + carte sombre Label APEBI TechTalent.

### 4.7 Formation (`/formation`)
Hero sombre (lueur radiale unique, coin haut-droit) « Former la prochaine génération... ». 2 CTA (Explorer / Devenir partenaire). Section 3 cartes « Label expliqué » (Label qualité C5, Alignés sur le marché, Passerelle vers l'emploi). Catalogue avec chips de domaine, grid de cartes formation (logo école placeholder, badge « Partenaire labellisé C5 », titre, chips domaine/format/durée, description, niveau + CTA détails). CTA final sombre « Vous formez des talents tech ? ».

### 4.8 Dashboard recruteur (`/entreprise/dashboard`)
Fond `#F8F8F8`. Navbar app. Header « Tableau de bord » + CTA « + Créer une offre ». 4 KPI cards (Offres actives, Candidatures reçues, Profils consultés, Taux de réponse) avec variation verte optionnelle. Layout 1.6fr/0.9fr : gauche = table Candidatures récentes (avatar initiales couleur, nom/titre, offre, date, statut coloré) ; droite = carte Mes offres (liste statut badge), carte Shortlist talents (avatars + dispo + CTA rechercher), **carte sombre « Matching IA »** (voir Écarts actés — non implémentée en prod, données non réelles).

### 4.9 Profil talent (`/talent/profil`)
Fond `#F8F8F8`. Bandeau vert « Profil validé » si approuvé. Carte identité (avatar initiales, nom, titre/ville, badges disponibilité/séniorité/télétravail) + barre de complétude (dégradé cyan). Layout 1.6fr/0.9fr : gauche = Résumé, Expériences (timeline logo+titre+dates), Formation & certifications ; droite (sticky) = Compétences (chips), Préférences de poste (clé-valeur), **toggle Visibilité du profil**.

---

## 5. Écarts déjà actés (volontaires — ne pas « corriger »)

Décisions prises lors de l'import initial (PR #1), à ne pas reconsidérer sans discussion explicite :

1. **Témoignages placeholder (Landing)** — non implémentés : le mockup utilise des slots factices sans données réelles ; les afficher aurait menti sur le produit.
2. **Widget « Matching IA » (DashboardRecruteur)** — non implémenté : pas de moteur de matching IA réel branché à cette vue actuellement.
3. **Widget « Shortlist talents » (DashboardRecruteur)** — non implémenté pour la même raison (données fictives dans le mockup).

## 6. Écarts à trancher (nécessitent une décision produit avant d'être traités comme bug ou feature)

1. **Boutons Google/LinkedIn sur Connexion/Inscription** — présents dans le mockup, absents du produit. Est-ce un OAuth à implémenter, ou un écart volontaire (pas de provider configuré) ?
2. **Navbar transition dark→light au scroll sur Landing** — le mockup a une navbar qui commence transparente/sombre puis devient blanche après 40px de scroll. Le produit a-t-il ce comportement, ou une navbar blanche fixe partout (cohérent avec la décision « thème light unifié » du commit `217c0c2`) ? Si la navbar blanche fixe est le choix assumé post-unification thème, documenter ici comme acté et retirer de cette liste.
3. **Burger menu mobile Landing** — à vérifier si l'overlay plein écran + cascade de liens du mockup existe dans le produit actuel ou si le menu mobile suit un autre pattern (ex. Sheet shadcn).

## 7. Gaps de fidélité — suivi

| # | Gap | Page | Sévérité | Statut |
|---|---|---|---|---|
| 1 | Dégradé du titre hero statique au lieu d'animé (`gradientShift`) | Landing | Basse — cosmétique | ✅ Corrigé 12/07/2026 |
| 2 | `NetworkGraph` sans dynamique de mouvement | Landing | Moyenne — signature visuelle du hero | ✅ Corrigé 12/07/2026 (dérive CSS, structure hub conservée — voir note §4.1) |
| 3 | Aucun reveal au scroll sur les sections hors hero | Landing | Moyenne — impression de page « statique » vs mockup | ✅ Corrigé 12/07/2026 (`ScrollReveal`) |
| 4 | Burger menu mobile à vérifier (existence + fidélité de l'animation) | Landing | À investiguer | ⏳ Non traité |
| 5 | Navbar transition scroll dark→light à vérifier vs choix thème light unifié | Landing | À trancher | ⏳ Non traité — voir §6 |
| 6 | Reveal au scroll non vérifié sur Formation/Entreprises/OffreDetail (sections dans le même esprit que Landing) | Formation, Entreprises, OffreDetail | À investiguer | ⏳ Non traité — hors scope de ce lot (correction limitée à Landing) |

---

*Document à maintenir à jour à chaque changement de design. Toute page qui diverge de sa section ci-dessus sans entrée correspondante dans « Écarts actés » est un bug de fidélité, pas une variante acceptable.*
