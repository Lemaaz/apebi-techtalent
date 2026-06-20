-- ============================================================
-- Migration 012 — Ajout cv_url à talent_profiles (TAL-12)
-- ============================================================
-- Le CV PDF d'un talent est stocké dans le bucket Supabase Storage 'resumes'
-- et référencé ici. Distinct de cv_url dans applications (CV soumis à une offre).

ALTER TABLE talent_profiles
  ADD COLUMN IF NOT EXISTS cv_url text;
