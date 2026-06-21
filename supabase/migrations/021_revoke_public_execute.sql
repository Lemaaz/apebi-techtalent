-- ============================================================
-- APEBI TechTalent — Migration 021 : Révocation EXECUTE PUBLIC (A0-4)
-- ============================================================
-- Complète la 019. Constat : l'ACL des fonctions contient `=X/postgres`
-- (grantee vide = PUBLIC) → EXECUTE accordé à PUBLIC, dont anon/authenticated
-- HÉRITENT. Le REVOKE ciblé anon/authenticated de la 019 était donc sans effet
-- réel (l'héritage PUBLIC restait). On révoque PUBLIC.
--
-- Après cette migration, les fonctions internes/trigger ne sont plus exécutables
-- que par postgres + service_role :
--   - triggers : le rôle déclencheur n'a pas besoin d'EXECUTE → DML inchangé
--   - cron/edge (refresh_observatoire, close_expired_job_postings) : service_role
--   - calculate_completeness_score : appelée par trigger_update_completeness
--     (SECURITY DEFINER owner postgres → s'exécute en tant que postgres)
--
-- create_company_with_member : on retire PUBLIC ; le grant explicite `authenticated`
-- (inscription) subsiste.
--
-- is_admin() / is_company_member() : NON touchées — exécutables par anon/authenticated
-- VOLONTAIREMENT (évaluées dans les policies RLS liées au rôle public). Elles ne
-- renvoient qu'un booléen sur l'utilisateur courant → aucune fuite. L'advisor
-- continuera de les signaler : c'est un faux positif assumé.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.refresh_observatoire()              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.close_expired_job_postings()        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_completeness_score(uuid)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_update_completeness()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.guard_label_columns()              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_applications_count()     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_applications_count()     FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.create_company_with_member(
  text, text, text, text, text, text, text, text, text, text, text
) FROM PUBLIC;
