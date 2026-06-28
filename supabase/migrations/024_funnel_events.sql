-- ============================================================
-- APEBI TechTalent — Migration 024 : Funnel events (D2.4)
-- ============================================================
-- Trace les étapes clés du parcours vers la mise en relation.
-- Alimentée exclusivement via service_role depuis les server actions.
-- Aucun accès direct API autorisé (RLS révoquée pour anon/authenticated).
--
-- Étapes tracées :
--   inscription          → talent crée son profil
--   candidature_envoyee  → talent postule à une offre
--   candidature_vue      → recruteur marque "viewed"
--   invitation_envoyee   → recruteur invite un talent à postuler
--   mise_en_relation     → recruteur marque "accepted"
-- ============================================================

CREATE TABLE public.funnel_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT        NOT NULL,
  talent_id   UUID        REFERENCES public.talent_profiles(id)  ON DELETE SET NULL,
  user_id     UUID        REFERENCES auth.users(id)              ON DELETE SET NULL,
  job_id      UUID        REFERENCES public.job_postings(id)     ON DELETE SET NULL,
  company_id  UUID        REFERENCES public.company_profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_funnel_events_type    ON public.funnel_events(event_type, created_at DESC);
CREATE INDEX idx_funnel_events_talent  ON public.funnel_events(talent_id);
CREATE INDEX idx_funnel_events_created ON public.funnel_events(created_at DESC);

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.funnel_events FROM anon, authenticated;
