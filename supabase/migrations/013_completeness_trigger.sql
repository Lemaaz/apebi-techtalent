-- ============================================================
-- Migration 013 — Calcul automatique completeness_score (TAL-09)
-- ============================================================
-- Scoring rules (total 100 pts) :
--   Infos de base     : first_name + last_name + title + bio        → 20 pts
--   Localisation      : city                                        → 5 pts
--   Expérience        : years_experience + seniority_level          → 10 pts
--   Disponibilité     : availability                                → 5 pts
--   Mode travail      : remote_preference                           → 5 pts
--   Compétences       : ≥1 skill                                    → 15 pts  (≥5 → 20 pts)
--   Expériences       : ≥1 expérience                               → 15 pts
--   Formation         : ≥1 formation                                → 10 pts
--   Avatar            : avatar_url                                  → 5 pts
--   CV PDF            : cv_url                                      → 5 pts
--   Liens pro         : linkedin_url OU github_url                  → 5 pts
-- ── Max = 105, on plafonne à 100 ─────────────────────────────

CREATE OR REPLACE FUNCTION calculate_completeness_score(p_talent_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score integer := 0;
  v_talent talent_profiles%ROWTYPE;
  v_skill_count integer;
  v_exp_count integer;
  v_edu_count integer;
BEGIN
  SELECT * INTO v_talent FROM talent_profiles WHERE id = p_talent_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Infos de base (20 pts)
  IF v_talent.first_name IS NOT NULL AND v_talent.first_name != '' THEN v_score := v_score + 5; END IF;
  IF v_talent.last_name IS NOT NULL  AND v_talent.last_name != ''  THEN v_score := v_score + 5; END IF;
  IF v_talent.title IS NOT NULL      AND v_talent.title != ''      THEN v_score := v_score + 5; END IF;
  IF v_talent.bio IS NOT NULL        AND v_talent.bio != ''        THEN v_score := v_score + 5; END IF;

  -- Localisation (5 pts)
  IF v_talent.city IS NOT NULL AND v_talent.city != '' THEN v_score := v_score + 5; END IF;

  -- Expérience déclarée (10 pts)
  IF v_talent.years_experience IS NOT NULL THEN v_score := v_score + 5; END IF;
  IF v_talent.seniority_level  IS NOT NULL THEN v_score := v_score + 5; END IF;

  -- Disponibilité (5 pts)
  IF v_talent.availability IS NOT NULL THEN v_score := v_score + 5; END IF;

  -- Mode de travail (5 pts)
  IF v_talent.remote_preference IS NOT NULL THEN v_score := v_score + 5; END IF;

  -- Avatar (5 pts)
  IF v_talent.avatar_url IS NOT NULL AND v_talent.avatar_url != '' THEN v_score := v_score + 5; END IF;

  -- CV PDF (5 pts)
  IF v_talent.cv_url IS NOT NULL AND v_talent.cv_url != '' THEN v_score := v_score + 5; END IF;

  -- Liens pro (5 pts)
  IF v_talent.linkedin_url IS NOT NULL OR v_talent.github_url IS NOT NULL THEN
    v_score := v_score + 5;
  END IF;

  -- Compétences (15 pts si ≥1, 20 pts si ≥5)
  SELECT COUNT(*) INTO v_skill_count FROM talent_skills WHERE talent_id = p_talent_id;
  IF v_skill_count >= 5 THEN
    v_score := v_score + 20;
  ELSIF v_skill_count >= 1 THEN
    v_score := v_score + 15;
  END IF;

  -- Expériences pro (15 pts)
  SELECT COUNT(*) INTO v_exp_count FROM experiences WHERE talent_id = p_talent_id;
  IF v_exp_count >= 1 THEN v_score := v_score + 15; END IF;

  -- Formation (10 pts)
  SELECT COUNT(*) INTO v_edu_count FROM educations WHERE talent_id = p_talent_id;
  IF v_edu_count >= 1 THEN v_score := v_score + 10; END IF;

  RETURN LEAST(v_score, 100);
END;
$$;

-- ── Trigger function ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_update_completeness()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_talent_id uuid;
BEGIN
  -- Pour les tables liées (talent_skills, experiences, educations)
  IF TG_TABLE_NAME IN ('talent_skills', 'experiences', 'educations') THEN
    IF TG_OP = 'DELETE' THEN
      v_talent_id := OLD.talent_id;
    ELSE
      v_talent_id := NEW.talent_id;
    END IF;
  ELSE
    -- Pour talent_profiles directement
    v_talent_id := NEW.id;
  END IF;

  UPDATE talent_profiles
  SET completeness_score = calculate_completeness_score(v_talent_id)
  WHERE id = v_talent_id;

  RETURN NULL;
END;
$$;

-- ── Attach triggers ───────────────────────────────────────────

DROP TRIGGER IF EXISTS trig_completeness_on_profile ON talent_profiles;
CREATE TRIGGER trig_completeness_on_profile
  AFTER INSERT OR UPDATE ON talent_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_completeness();

DROP TRIGGER IF EXISTS trig_completeness_on_skills ON talent_skills;
CREATE TRIGGER trig_completeness_on_skills
  AFTER INSERT OR DELETE ON talent_skills
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_completeness();

DROP TRIGGER IF EXISTS trig_completeness_on_experiences ON experiences;
CREATE TRIGGER trig_completeness_on_experiences
  AFTER INSERT OR DELETE ON experiences
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_completeness();

DROP TRIGGER IF EXISTS trig_completeness_on_educations ON educations;
CREATE TRIGGER trig_completeness_on_educations
  AFTER INSERT OR DELETE ON educations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_completeness();

-- ── Recalcul de tous les profils existants ────────────────────
UPDATE talent_profiles
SET completeness_score = calculate_completeness_score(id);
