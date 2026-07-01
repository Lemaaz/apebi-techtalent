-- ============================================================
-- APEBI TechTalent — Migration 027 : Parrainage (Growth C)
-- ============================================================
-- referral_codes : un code court partageable par utilisateur (talent OU
--   entreprise OU admin), généré à la demande.
-- referrals : attribution referrer -> referred, 1 parrain max par filleul.
-- Accès exclusivement service-role (server actions) — surface minimale.
-- ============================================================

CREATE TABLE public.referral_codes (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code       TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.referrals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_role    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referred_user_id)
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals      ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.referral_codes FROM anon, authenticated;
REVOKE ALL ON public.referrals      FROM anon, authenticated;
