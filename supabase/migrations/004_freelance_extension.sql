-- ============================================================
-- APEBI TechTalent — Migration 004 : Extension Missions Freelance (T5)
-- ============================================================
-- Dimension 1 du scope élargi (design doc 19/06 + eng review A5).
-- Décision eng review A5 : NE PAS créer `disponibilite_freelance`
-- (duplique talent_profiles.availability). NE PAS créer de booléen
-- `statut_freelance` (job_type[] contient déjà 'Freelance' — on filtre
-- les freelances via job_type @> ARRAY['Freelance']). On ajoute
-- uniquement les champs de tarification + durée de mission.
-- ============================================================

-- ── TALENT PROFILES : tarif journalier + durée mission ───────
ALTER TABLE talent_profiles
  ADD COLUMN IF NOT EXISTS tjm_min integer CHECK (tjm_min >= 0),
  ADD COLUMN IF NOT EXISTS tjm_max integer CHECK (tjm_max >= 0),
  ADD COLUMN IF NOT EXISTS mission_duration_weeks integer CHECK (mission_duration_weeks > 0);

-- Cohérence : tjm_max ne peut pas être inférieur à tjm_min quand les deux existent
ALTER TABLE talent_profiles
  ADD CONSTRAINT talent_tjm_range_valid
  CHECK (tjm_min IS NULL OR tjm_max IS NULL OR tjm_max >= tjm_min);

COMMENT ON COLUMN talent_profiles.tjm_min IS 'Tarif journalier minimum en MAD (freelance). NULL si non freelance.';
COMMENT ON COLUMN talent_profiles.tjm_max IS 'Tarif journalier maximum en MAD (freelance).';
COMMENT ON COLUMN talent_profiles.mission_duration_weeks IS 'Durée de mission souhaitée en semaines (freelance). NULL = indifférent.';

-- ── JOB POSTINGS : type Consulting + durée mission ───────────
-- Étend le CHECK contract_type existant pour inclure 'Consulting'.
-- ('Freelance' est déjà présent depuis 001_init_schema.)
ALTER TABLE job_postings DROP CONSTRAINT IF EXISTS job_postings_contract_type_check;
ALTER TABLE job_postings
  ADD CONSTRAINT job_postings_contract_type_check
  CHECK (contract_type IN ('CDI','CDD','Freelance','Stage','Alternance','Consulting'));

ALTER TABLE job_postings
  ADD COLUMN IF NOT EXISTS mission_duration text;

COMMENT ON COLUMN job_postings.mission_duration IS 'Durée affichée de la mission (ex: "3 mois", "6 mois"). Pertinent pour Freelance/Consulting.';

-- ── INDEX : recherche freelance par fourchette de TJM ────────
CREATE INDEX IF NOT EXISTS idx_talent_profiles_tjm ON talent_profiles(tjm_min, tjm_max)
  WHERE tjm_min IS NOT NULL;
