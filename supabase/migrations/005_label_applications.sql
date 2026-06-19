-- ============================================================
-- APEBI TechTalent — Migration 005 : Label APEBI TechTalent (T1 + T6)
-- ============================================================
-- Dimension 4 du scope élargi (design doc 19/06 + eng review A1, Q1, T6).
--
-- Décision eng review A1 : PAS d'association polymorphique
-- (applicant_id + applicant_type). On utilise deux FK nullable
-- (talent_id, company_id) + CHECK XOR → l'intégrité référentielle
-- est garantie par la BDD, les JOINs profitent des index FK,
-- et les policies RLS restent simples.
--
-- Décision eng review Q1/T6 : company_profiles.has_techtalent_label
-- + label_valid_until existent déjà (001_init_schema). On les RÉUTILISE
-- comme source de vérité du badge. On ajoute seulement label_qr_token.
-- On miroite ces 3 colonnes sur talent_profiles pour la symétrie.
-- ============================================================

-- ── COMPANY PROFILES : token de vérification QR ──────────────
ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS label_qr_token uuid UNIQUE;

COMMENT ON COLUMN company_profiles.label_qr_token IS 'Token public de vérification du Label (QR code). Généré à l''approbation. Badge actif = has_techtalent_label AND label_valid_until > now().';

-- ── TALENT PROFILES : colonnes Label (miroir de company) ─────
ALTER TABLE talent_profiles
  ADD COLUMN IF NOT EXISTS has_techtalent_label boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS label_valid_until date,
  ADD COLUMN IF NOT EXISTS label_qr_token uuid UNIQUE;

COMMENT ON COLUMN talent_profiles.has_techtalent_label IS 'Badge "Talent Labellisé APEBI" (Axe B). Source de vérité du badge talent.';

-- ── LABEL APPLICATIONS : dossier de candidature au Label ─────
-- Deux FK nullable + CHECK XOR : exactement un applicant (talent OU entreprise).
CREATE TABLE IF NOT EXISTS label_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid REFERENCES talent_profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  applicant_type text NOT NULL CHECK (applicant_type IN ('talent','enterprise')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','under_review','approved','rejected')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewer_id uuid REFERENCES auth.users(id),
  notes_admin text,
  criteria_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- XOR : exactement un des deux applicants est renseigné
  CONSTRAINT label_applicant_xor CHECK ((talent_id IS NULL) <> (company_id IS NULL)),
  -- Cohérence applicant_type ↔ FK renseignée
  CONSTRAINT label_applicant_type_match CHECK (
    (applicant_type = 'talent' AND talent_id IS NOT NULL) OR
    (applicant_type = 'enterprise' AND company_id IS NOT NULL)
  )
);

-- Un seul dossier actif (non rejeté) par candidat à la fois
CREATE UNIQUE INDEX IF NOT EXISTS idx_label_app_one_active_talent
  ON label_applications(talent_id)
  WHERE talent_id IS NOT NULL AND status <> 'rejected';
CREATE UNIQUE INDEX IF NOT EXISTS idx_label_app_one_active_company
  ON label_applications(company_id)
  WHERE company_id IS NOT NULL AND status <> 'rejected';

-- Index pour la file d'attente admin (dossiers à examiner)
CREATE INDEX IF NOT EXISTS idx_label_app_status ON label_applications(status);

-- updated_at trigger (réutilise la fonction de 001_init_schema)
CREATE TRIGGER update_label_applications_updated_at
  BEFORE UPDATE ON label_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── RLS : sécurisé par défaut (deny-all) ─────────────────────
-- Les policies réelles arrivent en migration 007 (tâche T3).
-- Activer RLS sans policy = deny-all (sauf service_role) → aucune
-- fenêtre d'exposition non protégée via l'API publique.
ALTER TABLE label_applications ENABLE ROW LEVEL SECURITY;
