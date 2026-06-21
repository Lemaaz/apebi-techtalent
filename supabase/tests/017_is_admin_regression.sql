-- ============================================================
-- Test de régression — faille is_admin() (migration 017)
-- ============================================================
-- À exécuter via : MCP execute_sql, `supabase db query`, ou psql.
-- Tout se passe dans une transaction ROLLBACK : aucun effet persistant.
--
-- Vérifie :
--   1. user_metadata.role='ADMIN' SEUL  => is_admin() = FALSE (escalade bloquée)
--   2. app_metadata.role='ADMIN'        => is_admin() = TRUE
--   3. app_metadata.role='SUPER_ADMIN'  => is_admin() = TRUE
--   4. aucun rôle                       => is_admin() = FALSE
-- Le test ÉCHOUE (RAISE EXCEPTION) si l'un des cas ne tient pas.
-- ============================================================

BEGIN;

-- 3 utilisateurs de test
INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, raw_app_meta_data)
VALUES
  -- Cas 1 : attaquant — se déclare ADMIN dans user_metadata seulement
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'attacker@test.local',
   '{"role":"ADMIN"}'::jsonb, '{}'::jsonb),
  -- Cas 2 : vrai admin — app_metadata
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'admin@test.local',
   '{}'::jsonb, '{"role":"ADMIN"}'::jsonb),
  -- Cas 3 : super-admin — app_metadata
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'superadmin@test.local',
   '{}'::jsonb, '{"role":"SUPER_ADMIN"}'::jsonb),
  -- Cas 4 : utilisateur lambda
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'user@test.local',
   '{}'::jsonb, '{}'::jsonb);

DO $$
DECLARE
  r boolean;
BEGIN
  -- Cas 1 — escalade via user_metadata DOIT être bloquée
  PERFORM set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1"}', true);
  SELECT public.is_admin() INTO r;
  IF r IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'ÉCHEC cas 1 : un user avec user_metadata.role=ADMIN obtient is_admin()=% (attendu false) — ESCALADE DE PRIVILÈGES', r;
  END IF;

  -- Cas 2 — vrai admin via app_metadata
  PERFORM set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2"}', true);
  SELECT public.is_admin() INTO r;
  IF r IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'ÉCHEC cas 2 : ADMIN (app_metadata) obtient is_admin()=% (attendu true)', r;
  END IF;

  -- Cas 3 — super-admin via app_metadata
  PERFORM set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3"}', true);
  SELECT public.is_admin() INTO r;
  IF r IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'ÉCHEC cas 3 : SUPER_ADMIN (app_metadata) obtient is_admin()=% (attendu true)', r;
  END IF;

  -- Cas 4 — utilisateur lambda
  PERFORM set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4"}', true);
  SELECT public.is_admin() INTO r;
  IF r IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'ÉCHEC cas 4 : utilisateur lambda obtient is_admin()=% (attendu false)', r;
  END IF;

  RAISE NOTICE '✅ Les 4 cas de is_admin() passent — faille corrigée.';
END $$;

ROLLBACK;
