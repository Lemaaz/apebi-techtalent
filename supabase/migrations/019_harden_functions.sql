-- ============================================================
-- APEBI TechTalent — Migration 019 : Durcissement fonctions (A0-4)
-- ============================================================
-- Advisor sécurité prod (22/06/2026) :
--   lint 0011 (function_search_path_mutable) : 7 fonctions sans search_path figé
--   lint 0028/0029 (anon/authenticated_security_definer_function_executable) :
--     fonctions SECURITY DEFINER appelables via /rest/v1/rpc/* par anon/authenticated
--
-- Vérifs préalables (en prod, 22/06) :
--   - anon & authenticated n'ont PAS CREATE sur le schéma public
--     → `search_path = public` ne peut pas être détourné (pas d'injection d'objet)
--   - aucune des fonctions ci-dessous (hors is_admin/is_company_member) n'est
--     référencée dans une policy RLS ni appelée en RPC côté client
--   - chaque corps qualifie déjà ses références hors public (auth.uid/auth.role)
--
-- is_admin() et is_company_member() sont VOLONTAIREMENT laissées exécutables :
-- elles sont évaluées dans des policies RLS liées au rôle public (donc traversées
-- par anon lors des lectures publiques) ; révoquer EXECUTE casserait toutes ces
-- lectures (« permission denied for function »). Elles ne renvoient qu'un booléen
-- sur l'utilisateur courant — aucune fuite de données.
-- ============================================================

-- ── 1. Figer search_path (lint 0011) ────────────────────────
-- ALTER (non destructif) — conserve le corps exact. `public` est requis car les
-- corps référencent des objets non qualifiés du schéma public (tables, mv_*, is_admin()).
ALTER FUNCTION public.refresh_observatoire()                  SET search_path = public;
ALTER FUNCTION public.close_expired_job_postings()           SET search_path = public;
ALTER FUNCTION public.calculate_completeness_score(uuid)     SET search_path = public;
ALTER FUNCTION public.trigger_update_completeness()          SET search_path = public;
ALTER FUNCTION public.guard_label_columns()                  SET search_path = public;
ALTER FUNCTION public.update_updated_at_column()             SET search_path = public;
ALTER FUNCTION public.is_company_member(uuid)                SET search_path = public;

-- ── 2. Révoquer EXECUTE aux rôles API (lint 0028/0029) ──────
-- Fonctions internes (cron/edge en service_role) + fonctions trigger.
-- Les triggers s'exécutent sans EXECUTE du rôle déclencheur → DML inchangé.
REVOKE EXECUTE ON FUNCTION public.refresh_observatoire()              FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.close_expired_job_postings()        FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_completeness_score(uuid)  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_update_completeness()       FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_label_columns()              FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()         FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_applications_count()     FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_applications_count()     FROM anon, authenticated;

-- create_company_with_member : inscription = flux AUTHENTIFIÉ (user.id déjà résolu)
-- → on retire anon, on garde authenticated.
REVOKE EXECUTE ON FUNCTION public.create_company_with_member(
  text, text, text, text, text, text, text, text, text, text, text
) FROM anon;
