-- ============================================================
-- Migration 015 — Expiration automatique des offres (OFF-10)
-- ============================================================
-- Ferme les offres actives dont closes_at est dépassé.
-- Deux approches selon disponibilité de pg_cron :
--   A) pg_cron (Supabase Pro / extensible) → tâche quotidienne
--   B) Edge function Supabase (plan Free) → appel via cron externe

-- ── Fonction de fermeture ─────────────────────────────────────

CREATE OR REPLACE FUNCTION close_expired_job_postings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE job_postings
  SET status = 'closed',
      updated_at = now()
  WHERE status = 'active'
    AND closes_at IS NOT NULL
    AND closes_at < CURRENT_DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION close_expired_job_postings IS
  'Ferme les offres actives dont la date de clôture est dépassée. '
  'Appelée quotidiennement par pg_cron ou via l''edge function expire-jobs.';

-- ── Planification pg_cron (tous les jours à 02h00 UTC) ───────
-- Gardée : la migration n'échoue pas si pg_cron n'est pas disponible.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;

    -- Supprimer le job existant s'il existe déjà
    PERFORM cron.unschedule('close-expired-jobs')
      WHERE EXISTS (
        SELECT 1 FROM cron.job WHERE jobname = 'close-expired-jobs'
      );

    PERFORM cron.schedule(
      'close-expired-jobs',          -- nom du job
      '0 2 * * *',                   -- tous les jours à 02h00 UTC
      $$SELECT close_expired_job_postings()$$
    );

    RAISE NOTICE 'pg_cron job "close-expired-jobs" planifié (quotidien à 02h00 UTC).';
  ELSE
    RAISE NOTICE 'pg_cron non disponible. Utiliser l''edge function expire-jobs pour la planification.';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron non configuré (%). Utiliser l''edge function expire-jobs.', SQLERRM;
END;
$$;

-- ── Exécution immédiate sur les offres déjà expirées ─────────
SELECT close_expired_job_postings();
