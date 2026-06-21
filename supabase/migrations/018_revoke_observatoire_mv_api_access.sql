-- ============================================================
-- APEBI TechTalent — Migration 018 : Sécurité Observatoire (A0-3)
-- ============================================================
-- Advisor sécurité prod (22/06/2026) — lint 0016_materialized_view_in_api :
-- les 4 vues matérialisées de l'Observatoire sont sélectionnables par les
-- rôles `anon` / `authenticated`, donc requêtables DIRECTEMENT via l'API Data
-- (`/rest/v1/mv_*`). Cela contourne le seuil de représentativité (200 talents
-- validés / 100 offres actives) appliqué uniquement côté application, et expose
-- des agrégats fins (ex. villes à faible effectif) → risque de ré-identification.
--
-- Correctif : révoquer tout accès API à ces vues. L'application les lit désormais
-- côté serveur via le client service-role (`createAdminClient`) — la clé n'est
-- jamais exposée au navigateur. Le `service_role` et `postgres` conservent l'accès.
--
-- Annule le GRANT SELECT introduit en migration 008 (lignes 93-96).
-- ============================================================

REVOKE ALL ON mv_skills_demand    FROM anon, authenticated;
REVOKE ALL ON mv_skills_supply    FROM anon, authenticated;
REVOKE ALL ON mv_geo_distribution FROM anon, authenticated;
REVOKE ALL ON mv_domain_activity  FROM anon, authenticated;
