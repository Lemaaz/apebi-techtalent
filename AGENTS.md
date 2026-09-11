<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Spec-Driven Development (obligatoire)

Ce projet suit une méthode **Spec-Driven Development** : la spécification est la source de vérité, le code en découle. Framework complet → [`docs/spec-driven-development/`](docs/spec-driven-development/README.md).

**Niveau courant : 2 (Spec-anchored).** Avant d'écrire du code, tu **dois** :

1. Identifier la story et sa **spec-pilote** (dans `docs/superpowers/specs/`).
2. Si aucune spec ne couvre le travail → la **créer** depuis un template de `docs/spec-driven-development/templates/` **avant** de coder.
3. Si le code doit dévier de la spec → **mettre à jour la spec dans la même PR**, ou t'arrêter et demander arbitrage.

Aucun code orphelin : tout code se rattache à une story, toute story à une spec. Détail des niveaux → [`MATURITY-LEVELS.md`](docs/spec-driven-development/MATURITY-LEVELS.md) · phases & cycle Agile → [`LIFECYCLE.md`](docs/spec-driven-development/LIFECYCLE.md).
