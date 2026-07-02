-- ============================================================
-- APEBI TechTalent — Migration 029 : corrige la dérive RLS sur
-- storage.objects (audit sécurité 2026-07-02, couche Storage)
-- ============================================================
-- Constat : storage.objects a des policies dupliquées / dérivées
-- (nommage singulier vs pluriel = 2 migrations successives sans
-- nettoyage de la premiere — meme symptome que la derive documentee
-- dans CLAUDE.md). En RLS Postgres, plusieurs policies permissives
-- sur la meme commande sont combinees en OR : une vieille policy
-- large neutralise silencieusement une nouvelle policy plus stricte.
--
-- 3 trous reels trouves et VERIFIES EN DIRECT contre la prod :
--
-- 1. bucket 'resumes' (celui reellement utilise par /api/upload) —
--    AUCUNE policy storage.objects. RLS activee + 0 policy = deny
--    par defaut → upload CV cassé pour TOUS les utilisateurs reels
--    (verifie : 403 "new row violates row-level security policy").
--    Bug fonctionnel autant que securite.
--
-- 2. bucket 'logos' (public) — policy 'logos_member_upload' avec
--    with_check = auth.role() = 'authenticated' SANS scoping de
--    dossier. Verifie en direct : un compte quelconque (admin, pas
--    meme membre d'entreprise) peut ecrire n'importe quel chemin,
--    y compris un SVG avec <script> (image/svg+xml autorise au
--    niveau bucket) — stocke-XSS sur le sous-domaine storage public.
--    Meme bug sur 'banners'.
--
-- 3. bucket 'cvs' (legacy, non reference par le code app actuel,
--    qui utilise 'resumes') — policy 'cv_owner_read' permet a TOUT
--    membre d'ENTREPRISE QUELCONQUE (meme non approuvee) de lire
--    le CV de N'IMPORTE QUEL talent, sans lien de candidature. Une
--    policy plus stricte existe en parallele (cvs_owner_read,
--    limitee aux entreprises approuvees) mais est neutralisee par
--    l'OR avec la policy large. Aucun fichier reel expose a ce jour
--    (0 lignes dans storage.objects pour ce bucket) — corrige avant
--    tout usage reel.
--
-- Fix : toutes les policies d'ecriture/lecture repassent sur le
-- meme pattern que /api/upload utilise deja pour le chemin
-- ({user.id}/filename) : auth.uid() = (storage.foldername(name))[1].
-- ============================================================

-- ── AVATARS — supprime les doublons exacts (meme predicat), garde
--    le jeu au nom coherent avec le bucket ──
DROP POLICY IF EXISTS "avatar_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "avatar_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "avatar_owner_upsert" ON storage.objects;

-- ── LOGOS — remplace les policies non-scopees par dossier ──
DROP POLICY IF EXISTS "logo_member_upsert" ON storage.objects;
DROP POLICY IF EXISTS "logo_member_update" ON storage.objects;
DROP POLICY IF EXISTS "logos_member_upload" ON storage.objects;
DROP POLICY IF EXISTS "logos_member_update" ON storage.objects;

CREATE POLICY "logos_owner_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "logos_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "logos_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── BANNERS — meme bug, meme fix (+ update/delete manquants) ──
DROP POLICY IF EXISTS "banners_member_upload" ON storage.objects;

CREATE POLICY "banners_owner_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "banners_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "banners_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── CVS (legacy, non utilisée par l'app actuelle) — retire la
--    policy de lecture trop large, garde le reste ──
DROP POLICY IF EXISTS "cv_owner_read" ON storage.objects;
DROP POLICY IF EXISTS "cv_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "cv_talent_insert" ON storage.objects;

-- ── RESUMES — bucket réellement utilisé par /api/upload, 0 policy
--    avant ce fix (upload cassé pour tout le monde) ──
CREATE POLICY "resumes_owner_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "resumes_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "resumes_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Lecture : le propriétaire, OU un membre d'une entreprise APPROUVÉE
-- (même logique que cvs_owner_read, la version correcte du legacy).
CREATE POLICY "resumes_scoped_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes' AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM company_members cm
        JOIN company_profiles cp ON cp.id = cm.company_id
        WHERE cm.user_id = auth.uid() AND cp.validation_status = 'approved'
      )
    )
  );
