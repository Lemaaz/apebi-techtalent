-- ============================================================
-- APEBI TechTalent — Migration 017 : Fix faille is_admin()
-- ============================================================
-- CONTEXTE (revue sécurité /autoplan, 22/06/2026) :
-- La migration 003 définissait is_admin() en lisant raw_user_meta_data->>'role'.
-- raw_user_meta_data (user_metadata) est MODIFIABLE par l'utilisateur lui-même
-- via supabase.auth.updateUser({ data: { role: 'ADMIN' } }).
-- => Escalade de privilèges : tout talent pouvait se déclarer ADMIN et obtenir
--    l'accès RLS complet (la RLS est le "dernier rempart", ARCHITECTURE.md §3.4).
-- De plus, elle ne matchait que 'ADMIN', pas 'SUPER_ADMIN' => les vrais
-- super-admins échouaient toutes les policies RLS.
--
-- ÉTAT CONSTATÉ EN PROD (lpubaknjsyslmgyipsrd, 22/06/2026) : la fonction a
-- DÉJÀ été corrigée directement en base (hotfix dashboard) — elle lit déjà
-- raw_app_meta_data. MAIS aucune migration ne l'enregistrait : le repo avait
-- dérivé de la prod. Cette migration RÉTABLIT la cohérence repo ↔ prod, pour
-- qu'un rebuild depuis les migrations (nouvel env, DR, dev local) ne recrée
-- PAS la faille. Idempotente : sur la prod actuelle, elle ne change rien.
--
-- Référence Supabase : "Never use user_metadata claims in authorization
-- decisions. Store authorization data in raw_app_meta_data instead."
-- ============================================================

-- ── 1. Backfill de sécurité (AVANT de (re)définir la fonction) ───────
-- Garantit qu'aucun admin existant ne perde l'accès. N'agit que sur les
-- comptes legacy dont app_metadata.role est absent mais user_metadata.role
-- est ADMIN/SUPER_ADMIN. Idempotent (0 ligne sur une prod déjà saine).
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', raw_user_meta_data->>'role')
WHERE raw_user_meta_data->>'role' IN ('ADMIN', 'SUPER_ADMIN')
  AND COALESCE(raw_app_meta_data->>'role', '') NOT IN ('ADMIN', 'SUPER_ADMIN');

-- ── 2. Définition sûre (reproduit fidèlement l'état prod) ────────────
-- SECURITY DEFINER + search_path épinglé. auth.uid() et auth.users sont
-- schéma-qualifiés, donc immunisés au détournement de search_path.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_app_meta_data->>'role' IN ('ADMIN', 'SUPER_ADMIN')
  );
END;
$function$;

COMMENT ON FUNCTION public.is_admin() IS
  'Retourne true si l''utilisateur courant est ADMIN ou SUPER_ADMIN. '
  'Lit raw_app_meta_data (app_metadata, service_role-only) — JAMAIS '
  'raw_user_meta_data qui est modifiable par l''utilisateur. Voir migration 017.';

-- is_admin() est réutilisé par les policies des migrations 003, 007, 009 et
-- par le trigger guard_label_columns() (007). CREATE OR REPLACE met à jour le
-- corps sans toucher aux policies/triggers qui la référencent.
