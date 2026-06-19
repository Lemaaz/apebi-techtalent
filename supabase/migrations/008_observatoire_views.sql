-- ============================================================
-- APEBI TechTalent — Migration 008 : Observatoire (T7)
-- ============================================================
-- Dimension 2 du scope élargi (design doc 19/06 + eng review P1).
-- L'Observatoire des Compétences = le levier de plaidoyer APEBI.
--
-- Décision eng review P1 : pas d'agrégation à la volée à chaque rendu
-- (GROUP BY/COUNT sur des milliers de lignes). On précalcule via
-- MATERIALIZED VIEW + refresh périodique (pg_cron / edge function).
-- La page /observatoire fait un simple SELECT (rapide) en ISR 1h.
--
-- Données publiques agrégées (aucune PII) → SELECT accordé à anon.
-- ============================================================

-- ── VUE 1 : Compétences les plus demandées (offres actives) ──
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_skills_demand AS
  SELECT
    s.id          AS skill_id,
    s.name,
    s.name_en,
    s.domain_id,
    d.code        AS domain_code,
    count(DISTINCT jp.id) AS demand_count
  FROM skills s
  JOIN job_skills js   ON js.skill_id = s.id
  JOIN job_postings jp ON jp.id = js.job_id AND jp.status = 'active'
  LEFT JOIN domains d  ON d.id = s.domain_id
  GROUP BY s.id, s.name, s.name_en, s.domain_id, d.code
WITH DATA;

-- Index UNIQUE obligatoire pour REFRESH ... CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_skills_demand_pk ON mv_skills_demand(skill_id);
CREATE INDEX IF NOT EXISTS idx_mv_skills_demand_rank ON mv_skills_demand(demand_count DESC);

-- ── VUE 2 : Compétences les plus déclarées (talents validés) ─
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_skills_supply AS
  SELECT
    s.id          AS skill_id,
    s.name,
    s.name_en,
    s.domain_id,
    d.code        AS domain_code,
    count(DISTINCT tp.id) AS supply_count
  FROM skills s
  JOIN talent_skills ts   ON ts.skill_id = s.id
  JOIN talent_profiles tp ON tp.id = ts.talent_id
    AND tp.validation_status = 'approved'
    AND tp.visibility = true
  LEFT JOIN domains d ON d.id = s.domain_id
  GROUP BY s.id, s.name, s.name_en, s.domain_id, d.code
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_skills_supply_pk ON mv_skills_supply(skill_id);
CREATE INDEX IF NOT EXISTS idx_mv_skills_supply_rank ON mv_skills_supply(supply_count DESC);

-- ── VUE 3 : Répartition géographique des talents validés ─────
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_geo_distribution AS
  SELECT
    lower(trim(city)) AS city_key,
    min(city)         AS city,
    count(*)          AS talent_count
  FROM talent_profiles
  WHERE validation_status = 'approved'
    AND city IS NOT NULL
    AND trim(city) <> ''
  GROUP BY lower(trim(city))
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_geo_distribution_pk ON mv_geo_distribution(city_key);

-- ── VUE 4 : Activité par domaine C5 (offres vs talents) ──────
-- Donne le déséquilibre offre/demande par domaine — cœur du plaidoyer.
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_domain_activity AS
  SELECT
    d.id      AS domain_id,
    d.code,
    d.name_fr,
    d.name_en,
    (SELECT count(*) FROM job_postings jp
      WHERE jp.domain_id = d.id AND jp.status = 'active') AS active_jobs,
    (SELECT count(DISTINCT ts.talent_id)
      FROM talent_skills ts
      JOIN skills s          ON s.id = ts.skill_id AND s.domain_id = d.id
      JOIN talent_profiles tp ON tp.id = ts.talent_id
        AND tp.validation_status = 'approved' AND tp.visibility = true
    ) AS approved_talents
  FROM domains d
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_domain_activity_pk ON mv_domain_activity(domain_id);

-- ── Accès public en lecture (données agrégées, sans PII) ─────
GRANT SELECT ON mv_skills_demand     TO anon, authenticated;
GRANT SELECT ON mv_skills_supply     TO anon, authenticated;
GRANT SELECT ON mv_geo_distribution  TO anon, authenticated;
GRANT SELECT ON mv_domain_activity   TO anon, authenticated;

-- ── Fonction de refresh (concurrent — pas de lock lecture) ───
CREATE OR REPLACE FUNCTION refresh_observatoire()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_skills_demand;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_skills_supply;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_geo_distribution;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_domain_activity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_observatoire IS 'Rafraîchit les 4 vues de l''Observatoire. Appelée par pg_cron (toutes les 6h) ou l''edge function refresh-observatoire.';

-- ── Planification pg_cron (toutes les 6h) — guardée ──────────
-- Si pg_cron n'est pas disponible, la migration n'échoue pas :
-- le refresh se fait alors via l'edge function planifiée.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    -- Supprime un éventuel job existant avant de (re)planifier
    PERFORM cron.unschedule('refresh-observatoire')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-observatoire');
    PERFORM cron.schedule('refresh-observatoire', '0 */6 * * *', 'SELECT refresh_observatoire();');
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron non configuré (%). Utiliser l''edge function refresh-observatoire pour le refresh planifié.', SQLERRM;
END $$;
