-- ============================================================
-- APEBI TechTalent — Migration 023 : Alertes email talents (NOT-06 + D3)
-- ============================================================
-- receive_alerts : consent explicite pour les emails d'alerte offres
--   (true par défaut — opt-out via lien unsubscribe dans chaque email)
-- last_alerted_at : anti-doublon — on n'alerte que sur les offres
--   publiées APRÈS cette date (évite de re-notifier)
-- ============================================================

ALTER TABLE public.talent_profiles
  ADD COLUMN IF NOT EXISTS receive_alerts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_alerted_at TIMESTAMPTZ;
