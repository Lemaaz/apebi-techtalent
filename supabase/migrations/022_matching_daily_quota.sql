-- ============================================================
-- APEBI TechTalent — Migration 022 : Quota journalier matching IA (A3)
-- ============================================================
-- Protège le coût Claude Haiku contre les appels non bornés.
-- Un compteur atomique par (user_id, date) garantit l'enforcement
-- distribué (contrairement au rate-limiter in-memory de proxy.ts
-- qui est par-isolate Vercel).
--
-- Limite : 30 appels matching/user/jour (recruteur ou talent).
-- Coût estimé : Claude Haiku ~$0.002/appel → max $0.06/user/jour.
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_matching_quota (
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quota_date DATE    NOT NULL DEFAULT CURRENT_DATE,
  call_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, quota_date)
);

-- Seul le user lui-même peut voir son quota (pas d'admin — données techniques)
ALTER TABLE daily_matching_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_quota" ON daily_matching_quota
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Fonction RPC : incrémente et retourne le nouveau call_count (atomique)
CREATE OR REPLACE FUNCTION public.increment_matching_quota(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO daily_matching_quota (user_id, quota_date, call_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, quota_date)
  DO UPDATE SET call_count = daily_matching_quota.call_count + 1
  RETURNING call_count INTO v_count;
  RETURN v_count;
END;
$$;

-- Seul le service_role et le user lui-même peuvent appeler cette fonction
REVOKE EXECUTE ON FUNCTION public.increment_matching_quota(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_matching_quota(UUID) TO authenticated;

-- Nettoyage automatique des entrées > 7 jours (pg_cron, si disponible)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('cleanup-matching-quota')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-matching-quota');
    PERFORM cron.schedule(
      'cleanup-matching-quota',
      '0 3 * * *',
      $$DELETE FROM public.daily_matching_quota WHERE quota_date < CURRENT_DATE - 7$$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron non disponible pour le cleanup quota (%). OK — nettoyage manuel possible.', SQLERRM;
END $$;
