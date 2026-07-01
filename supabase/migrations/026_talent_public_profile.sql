-- ============================================================
-- APEBI TechTalent — Migration 026 : Profil public partageable (Growth B)
-- ============================================================
-- Opt-in explicite : le talent choisit de rendre son profil accessible
-- via un lien public /t/<token>. Défaut = privé (respecte le modèle).
-- public_token généré à l'activation, révocable (regénération ou désactivation).
-- ============================================================

ALTER TABLE public.talent_profiles
  ADD COLUMN IF NOT EXISTS public_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_token UUID;

-- Index unique partiel : un token n'existe que si non-null
CREATE UNIQUE INDEX IF NOT EXISTS idx_talent_public_token
  ON public.talent_profiles(public_token)
  WHERE public_token IS NOT NULL;

-- La page /t/<token> lit côté serveur via service-role (filtrée strictement
-- sur public_enabled = true). Aucune policy anon ouverte → surface minimale.
