-- ============================================================
-- Migration 014 — Shortlist talents favoris recruteur (REC-03)
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_talents (
  company_id  uuid NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  talent_id   uuid NOT NULL REFERENCES talent_profiles(id)  ON DELETE CASCADE,
  saved_at    timestamptz DEFAULT now(),
  PRIMARY KEY (company_id, talent_id)
);

-- Index pour lookup rapide par company
CREATE INDEX IF NOT EXISTS idx_saved_talents_company ON saved_talents(company_id);

-- RLS : visible uniquement par les membres de la company
ALTER TABLE saved_talents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_talents_select" ON saved_talents
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "saved_talents_insert" ON saved_talents
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "saved_talents_delete" ON saved_talents
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid()
    )
  );
