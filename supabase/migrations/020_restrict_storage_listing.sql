-- ============================================================
-- APEBI TechTalent — Migration 020 : Restriction listing storage (A0-4)
-- ============================================================
-- Advisor sécurité prod (22/06/2026) — lint 0025 (public_bucket_allows_listing) :
-- les buckets publics `avatars`, `banners`, `logos` ont des policies SELECT larges
-- (`bucket_id = '<bucket>'` pour le rôle public) sur storage.objects. Elles
-- autorisent le LISTING/énumération de tous les fichiers (donc des UUID
-- utilisateurs encodés dans les chemins `<user_id>/<ts>.<ext>`), via
-- /storage/v1/object/list/<bucket>.
--
-- L'affichage public des images ne dépend PAS de ces policies : un bucket public
-- sert les objets via /storage/v1/object/public/<bucket>/<path> en contournant RLS.
--
-- MAIS : l'upload applicatif passe par /api/upload (client authenticated) avec
-- `upsert: true` → l'upsert exige une policy SELECT (checklist storage Supabase).
-- On remplace donc les SELECT publics larges par des SELECT restreints au
-- PROPRIÉTAIRE (son propre dossier), ce qui :
--   - supprime l'énumération publique (plus de listing anonyme),
--   - préserve l'upsert authentifié,
--   - n'affecte pas l'affichage public (endpoint public, hors RLS).
-- ============================================================

-- ── 1. Supprimer les SELECT publics larges (doublons inclus) ─
DROP POLICY IF EXISTS avatar_public_read  ON storage.objects;
DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
DROP POLICY IF EXISTS banners_public_read ON storage.objects;
DROP POLICY IF EXISTS logo_public_read    ON storage.objects;
DROP POLICY IF EXISTS logos_public_read   ON storage.objects;

-- ── 2. SELECT restreint au propriétaire (support upsert) ─────
-- Chemin d'upload = `<auth.uid>/<timestamp>.<ext>` → 1er segment = id propriétaire.
CREATE POLICY avatars_owner_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY logos_owner_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'logos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY banners_owner_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'banners' AND (auth.uid())::text = (storage.foldername(name))[1]);
