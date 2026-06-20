-- ============================================================
-- APEBI TechTalent — Migration 010 : Fix RLS talent_skills (ENG-10)
-- ============================================================
-- Correctif : la policy "talent_own_skills" (003) bloquait les recruteurs
-- sur la table talent_skills, ce qui causait :
--   1. Le filtre "domaine" dans /entreprise/recherche-talents retournait
--      systématiquement 0 résultats (query secondaire talent_skills bloquée).
--   2. Les compétences étaient invisibles dans les cartes talent vues
--      par les recruteurs (JOIN PostgREST RLS-filtré).
--
-- Fix : ajout d'une policy SELECT permettant aux recruteurs d'entreprises
-- validées de lire les compétences des talents approuvés et visibles.
-- ============================================================

CREATE POLICY "recruiter_read_approved_talent_skills" ON talent_skills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM talent_profiles tp
      WHERE tp.id = talent_id
        AND tp.validation_status = 'approved'
        AND tp.visibility = true
        AND EXISTS (
          SELECT 1 FROM company_members cm
          JOIN company_profiles cp ON cp.id = cm.company_id
          WHERE cm.user_id = auth.uid()
            AND cp.validation_status = 'approved'
        )
    )
  );
