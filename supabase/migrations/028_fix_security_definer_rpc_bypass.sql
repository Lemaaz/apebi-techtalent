-- ============================================================
-- APEBI TechTalent — Migration 028 : ferme le contournement RLS
-- via fonctions SECURITY DEFINER (audit sécurité 2026-07-02)
-- ============================================================
-- Constat : REVOKE EXECUTE ... FROM PUBLIC (migration 025) ne retire
-- PAS les grants EXECUTE explicites que Supabase attribue par défaut
-- à anon/authenticated sur toute nouvelle fonction du schema public
-- (ALTER DEFAULT PRIVILEGES côté projet). Vérifié en direct : un
-- appel anonyme à /rest/v1/rpc/funnel_event_counts retournait les
-- vraies métriques funnel malgré funnel_events verrouillée par RLS.
--
-- Deux fonctions concernées :
--   1. funnel_event_counts() — aucune vérification d'auth interne,
--      contournait le lockdown RLS de funnel_events. Fix : REVOKE
--      explicite sur anon ET authenticated (pas seulement PUBLIC).
--   2. increment_matching_quota(p_user_id) — n'a jamais vérifié que
--      l'appelant EST p_user_id. Un appelant anonyme pouvait
--      incrémenter le quota journalier de n'importe quel user_id
--      réel (vérifié : 200 sur un vrai compte). Fix : check interne
--      auth.uid() = p_user_id + revoke anon (authenticated légitime,
--      la route appelle toujours avec son propre id).
-- ============================================================

-- ── 1. funnel_event_counts — verrouillage réel (service_role uniquement) ──
REVOKE EXECUTE ON FUNCTION public.funnel_event_counts() FROM PUBLIC, anon, authenticated;
-- postgres + service_role gardent EXECUTE (déjà grantés, service_role
-- bypass de toute façon les grants — inchangé, c'est le seul appelant légitime).

-- ── 2. increment_matching_quota — check d'appartenance interne ──
CREATE OR REPLACE FUNCTION public.increment_matching_quota(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'forbidden: cannot modify another user''s quota' USING ERRCODE = '42501';
  END IF;

  INSERT INTO daily_matching_quota (user_id, quota_date, call_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, quota_date)
  DO UPDATE SET call_count = daily_matching_quota.call_count + 1
  RETURNING call_count INTO v_count;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_matching_quota(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_matching_quota(UUID) TO authenticated;
