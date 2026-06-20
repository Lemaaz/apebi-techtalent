-- ============================================================
-- APEBI TechTalent — Application combinée scope élargi V1.1
-- Migrations 004 → 008, dans l'ordre. À coller dans le SQL Editor
-- de lpubaknjsyslmgyipsrd. (Convenience — la source de vérité reste
-- les fichiers individuels dans migrations/ pour 'supabase db push'.)
-- ============================================================


-- ▼▼▼ 004_freelance_extension.sql ▼▼▼

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


-- ▼▼▼ 005_label_applications.sql ▼▼▼

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


-- ▼▼▼ 006_events.sql ▼▼▼

-- ============================================================
-- APEBI TechTalent — Migration 006 : Events & Networking (T2)
-- ============================================================
-- Dimension 3 du scope élargi (design doc 19/06 + eng review A2).
--
-- Décision eng review A2 : PAS de organisateur_id polymorphique
-- ambigu. L'organisateur est soit une entreprise membre
-- (organisateur_company_id), soit APEBI/C5 directement
-- (is_apebi_event = true, organisateur_company_id NULL).
-- created_by trace toujours l'admin qui a créé l'événement.
-- ============================================================

-- ── EVENTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  type_event text CHECK (type_event IN ('conference','workshop','job_fair','hackathon','networking')),
  date_debut timestamptz NOT NULL,
  date_fin timestamptz,
  lieu text,
  url_inscription_externe text,
  places_disponibles integer CHECK (places_disponibles IS NULL OR places_disponibles >= 0),
  image_url text,
  -- Organisateur : entreprise membre OU APEBI/C5 (is_apebi_event)
  organisateur_company_id uuid REFERENCES company_profiles(id) ON DELETE SET NULL,
  is_apebi_event boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  status text DEFAULT 'draft' CHECK (status IN ('draft','published','cancelled','past')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Cohérence : un event APEBI n'a pas d'entreprise organisatrice, et inversement
  CONSTRAINT event_organisateur_coherent CHECK (
    (is_apebi_event = true AND organisateur_company_id IS NULL) OR
    (is_apebi_event = false)
  ),
  -- Cohérence temporelle : fin après début
  CONSTRAINT event_dates_valid CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

CREATE INDEX IF NOT EXISTS idx_events_status_date ON events(status, date_debut);
CREATE INDEX IF NOT EXISTS idx_events_organisateur ON events(organisateur_company_id)
  WHERE organisateur_company_id IS NOT NULL;

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── EVENT REGISTRATIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'registered' CHECK (status IN ('registered','attended','cancelled','waitlist')),
  registered_at timestamptz DEFAULT now(),
  -- Un utilisateur ne s'inscrit qu'une fois par événement
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_reg_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_user ON event_registrations(user_id);

-- ── RLS : sécurisé par défaut (deny-all) ─────────────────────
-- Les policies réelles arrivent en migration 007 (tâche T3) :
-- lecture publique des events publiés, CRUD admin, inscriptions
-- visibles par leur propriétaire. Deny-all jusque là.
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;


-- ▼▼▼ 007_rls_v1_1.sql ▼▼▼

-- ============================================================
-- APEBI TechTalent — Migration 007 : RLS scope élargi V1.1 (T3)
-- ============================================================
-- Policies RLS pour les tables créées en 004-006.
-- RLS est DÉJÀ activé (deny-all) sur label_applications, events,
-- event_registrations depuis 005/006 — ici on ajoute les policies.
--
-- Réutilise les helpers de 003 : is_admin(), is_company_member(uuid).
--
-- ⚠️ SÉCURITÉ — corrige une escalade de privilège introduite par 005 :
-- les colonnes Label (has_techtalent_label, label_valid_until,
-- label_qr_token) ajoutées sur talent_profiles / company_profiles
-- tombent sous les policies permissives existantes
-- (talent_own_profile FOR ALL, members_update_company FOR UPDATE).
-- Sans garde-fou, un talent/recruteur pourrait s'AUTO-ATTRIBUER le Label.
-- → Trigger ci-dessous : seuls admin ou service_role écrivent ces colonnes.
-- ============================================================

-- ── LABEL APPLICATIONS ───────────────────────────────────────
-- Le talent propriétaire gère son dossier, MAIS ne peut pas se l'auto-approuver :
-- WITH CHECK borne les statuts qu'un non-admin peut écrire à draft/submitted.
CREATE POLICY "talent_own_label_app" ON label_applications
  FOR ALL
  USING (
    talent_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM talent_profiles WHERE id = talent_id AND user_id = auth.uid())
  )
  WITH CHECK (
    talent_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM talent_profiles WHERE id = talent_id AND user_id = auth.uid())
    AND status IN ('draft','submitted')
  );

-- Le recruteur membre de l'entreprise gère le dossier entreprise (idem borne statut)
CREATE POLICY "company_own_label_app" ON label_applications
  FOR ALL
  USING (
    company_id IS NOT NULL AND is_company_member(company_id)
  )
  WITH CHECK (
    company_id IS NOT NULL AND is_company_member(company_id)
    AND status IN ('draft','submitted')
  );

-- Admin : tout (examen, approbation, rejet)
CREATE POLICY "admin_all_label_app" ON label_applications
  FOR ALL USING (is_admin());

-- ── EVENTS ───────────────────────────────────────────────────
-- Public : lecture des événements publiés
CREATE POLICY "public_read_published_events" ON events
  FOR SELECT USING (status = 'published');

-- Organisateur (membre de l'entreprise organisatrice) : gère ses propres events
CREATE POLICY "organisateur_manage_events" ON events
  FOR ALL USING (
    organisateur_company_id IS NOT NULL AND is_company_member(organisateur_company_id)
  );

-- Admin : tout (y compris les events APEBI où organisateur_company_id IS NULL)
CREATE POLICY "admin_all_events" ON events
  FOR ALL USING (is_admin());

-- ── EVENT REGISTRATIONS ──────────────────────────────────────
-- L'utilisateur gère ses propres inscriptions
CREATE POLICY "user_own_event_reg" ON event_registrations
  FOR ALL USING (user_id = auth.uid());

-- L'organisateur de l'event voit qui s'est inscrit (ses events uniquement)
CREATE POLICY "organisateur_read_event_reg" ON event_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
        AND e.organisateur_company_id IS NOT NULL
        AND is_company_member(e.organisateur_company_id)
    )
  );

-- Admin : lecture de toutes les inscriptions
CREATE POLICY "admin_read_event_reg" ON event_registrations
  FOR SELECT USING (is_admin());

-- ============================================================
-- GARDE-FOU LABEL — empêche l'auto-attribution du badge
-- ============================================================
-- RLS Postgres est row-level (pas column-level). Pour protéger des
-- colonnes précises, on utilise un trigger BEFORE UPDATE qui rejette
-- toute modification des colonnes Label par un non-admin.
-- Bypass autorisé : role ADMIN (is_admin) ou service_role (backend de confiance).

CREATE OR REPLACE FUNCTION guard_label_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Détecte un changement sur l'une des colonnes Label
  IF (NEW.has_techtalent_label IS DISTINCT FROM OLD.has_techtalent_label)
     OR (NEW.label_valid_until IS DISTINCT FROM OLD.label_valid_until)
     OR (NEW.label_qr_token IS DISTINCT FROM OLD.label_qr_token) THEN
    -- Seuls admin ou service_role peuvent écrire ces colonnes
    IF NOT (is_admin() OR auth.role() = 'service_role') THEN
      RAISE EXCEPTION 'Les colonnes Label APEBI ne peuvent être modifiées que par un administrateur (escalade de privilège bloquée).'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER guard_label_columns_talent
  BEFORE UPDATE ON talent_profiles
  FOR EACH ROW EXECUTE FUNCTION guard_label_columns();

CREATE TRIGGER guard_label_columns_company
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW EXECUTE FUNCTION guard_label_columns();


-- ▼▼▼ 008_observatoire_views.sql ▼▼▼

-- ============================================================
-- APEBI TechTalent — Migration 008 : Observatoire (T7)
-- ============================================================
-- Dimension 2 du scope élargi (design doc 19/06 + eng review P1).
-- L'Observatoire des Compétences = le levier de plaidoyer APEBI.
--
-- Décision eng review P1 : pas d'agrégation à la volée à chaque rendu
-- (GROUP BY/COUNT sur des milliers de lignes). On précalcule via
-- MATERIALIZED VIEW + refresh périodique (pg_cron / edge function).
-- La page /observatoire fait un simple SELECT (rapide) en ISR 1h.
--
-- Données publiques agrégées (aucune PII) → SELECT accordé à anon.
-- ============================================================

-- ── VUE 1 : Compétences les plus demandées (offres actives) ──
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_skills_demand AS
  SELECT
    s.id          AS skill_id,
    s.name,
    s.name_en,
    s.domain_id,
    d.code        AS domain_code,
    count(DISTINCT jp.id) AS demand_count
  FROM skills s
  JOIN job_skills js   ON js.skill_id = s.id
  JOIN job_postings jp ON jp.id = js.job_id AND jp.status = 'active'
  LEFT JOIN domains d  ON d.id = s.domain_id
  GROUP BY s.id, s.name, s.name_en, s.domain_id, d.code
WITH DATA;

-- Index UNIQUE obligatoire pour REFRESH ... CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_skills_demand_pk ON mv_skills_demand(skill_id);
CREATE INDEX IF NOT EXISTS idx_mv_skills_demand_rank ON mv_skills_demand(demand_count DESC);

-- ── VUE 2 : Compétences les plus déclarées (talents validés) ─
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_skills_supply AS
  SELECT
    s.id          AS skill_id,
    s.name,
    s.name_en,
    s.domain_id,
    d.code        AS domain_code,
    count(DISTINCT tp.id) AS supply_count
  FROM skills s
  JOIN talent_skills ts   ON ts.skill_id = s.id
  JOIN talent_profiles tp ON tp.id = ts.talent_id
    AND tp.validation_status = 'approved'
    AND tp.visibility = true
  LEFT JOIN domains d ON d.id = s.domain_id
  GROUP BY s.id, s.name, s.name_en, s.domain_id, d.code
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_skills_supply_pk ON mv_skills_supply(skill_id);
CREATE INDEX IF NOT EXISTS idx_mv_skills_supply_rank ON mv_skills_supply(supply_count DESC);

-- ── VUE 3 : Répartition géographique des talents validés ─────
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_geo_distribution AS
  SELECT
    lower(trim(city)) AS city_key,
    min(city)         AS city,
    count(*)          AS talent_count
  FROM talent_profiles
  WHERE validation_status = 'approved'
    AND city IS NOT NULL
    AND trim(city) <> ''
  GROUP BY lower(trim(city))
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_geo_distribution_pk ON mv_geo_distribution(city_key);

-- ── VUE 4 : Activité par domaine C5 (offres vs talents) ──────
-- Donne le déséquilibre offre/demande par domaine — cœur du plaidoyer.
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_domain_activity AS
  SELECT
    d.id      AS domain_id,
    d.code,
    d.name_fr,
    d.name_en,
    (SELECT count(*) FROM job_postings jp
      WHERE jp.domain_id = d.id AND jp.status = 'active') AS active_jobs,
    (SELECT count(DISTINCT ts.talent_id)
      FROM talent_skills ts
      JOIN skills s          ON s.id = ts.skill_id AND s.domain_id = d.id
      JOIN talent_profiles tp ON tp.id = ts.talent_id
        AND tp.validation_status = 'approved' AND tp.visibility = true
    ) AS approved_talents
  FROM domains d
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_domain_activity_pk ON mv_domain_activity(domain_id);

-- ── Accès public en lecture (données agrégées, sans PII) ─────
GRANT SELECT ON mv_skills_demand     TO anon, authenticated;
GRANT SELECT ON mv_skills_supply     TO anon, authenticated;
GRANT SELECT ON mv_geo_distribution  TO anon, authenticated;
GRANT SELECT ON mv_domain_activity   TO anon, authenticated;

-- ── Fonction de refresh (concurrent — pas de lock lecture) ───
CREATE OR REPLACE FUNCTION refresh_observatoire()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_skills_demand;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_skills_supply;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_geo_distribution;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_domain_activity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_observatoire IS 'Rafraîchit les 4 vues de l''Observatoire. Appelée par pg_cron (toutes les 6h) ou l''edge function refresh-observatoire.';

-- ── Planification pg_cron (toutes les 6h) — guardée ──────────
-- Si pg_cron n'est pas disponible, la migration n'échoue pas :
-- le refresh se fait alors via l'edge function planifiée.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    -- Supprime un éventuel job existant avant de (re)planifier
    PERFORM cron.unschedule('refresh-observatoire')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-observatoire');
    PERFORM cron.schedule('refresh-observatoire', '0 */6 * * *', 'SELECT refresh_observatoire();');
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron non configuré (%). Utiliser l''edge function refresh-observatoire pour le refresh planifié.', SQLERRM;
END $$;

