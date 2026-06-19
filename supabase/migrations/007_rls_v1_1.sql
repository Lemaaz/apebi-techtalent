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
