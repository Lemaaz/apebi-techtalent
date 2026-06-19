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
