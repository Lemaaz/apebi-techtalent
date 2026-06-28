-- ============================================================
-- APEBI TechTalent — Migration 025 : RPC funnel_event_counts
-- ============================================================
-- Remplace les 5 COUNT() séparés du dashboard admin par une
-- seule requête GROUP BY event_type (eng review T5).
-- Appelée via supabase.rpc('funnel_event_counts').
-- ============================================================

CREATE OR REPLACE FUNCTION public.funnel_event_counts()
RETURNS TABLE (event_type TEXT, cnt BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT event_type, count(*) AS cnt
  FROM public.funnel_events
  GROUP BY event_type
$$;

REVOKE EXECUTE ON FUNCTION public.funnel_event_counts() FROM PUBLIC;
-- Lecture réservée au service_role (dashboard admin côté serveur)
