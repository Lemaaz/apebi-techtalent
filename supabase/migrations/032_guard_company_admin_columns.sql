-- ============================================================
-- APEBI TechTalent — Migration 032 : bloque l'auto-approbation
-- d'entreprise (escalade de privilège révélée par la migration 031)
-- ============================================================
-- La migration 031 a ajouté une policy SELECT nécessaire pour
-- qu'une entreprise en attente puisse voir/éditer son propre
-- profil (sinon bug bloquant en prod, cf migration précédente).
-- Mais cette même visibilité a réactivé une voie d'escalade :
-- members_update_company (UPDATE, is_company_member(id)) n'a pas
-- de WITH CHECK restreignant QUELLES colonnes peuvent changer —
-- un membre peut donc modifier n'importe quel champ, y compris
-- validation_status et is_featured (contrôlés normalement par
-- l'admin uniquement, cf admin/entreprises/actions.ts).
--
-- VÉRIFIÉ EN DIRECT avant ce fix : PATCH validation_status=approved
-- par un compte entreprise jetable → succès (200, statut passé à
-- 'approved'). Reverti immédiatement, aucune vraie entreprise
-- touchée.
--
-- Fix : même pattern que guard_label_columns() (déjà utilisé sur
-- talent_profiles et company_profiles pour les colonnes de label) —
-- trigger BEFORE UPDATE qui bloque toute modification de
-- validation_status / is_featured sauf par un admin ou service_role.
-- ============================================================

CREATE OR REPLACE FUNCTION public.guard_company_admin_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.validation_status IS DISTINCT FROM OLD.validation_status)
     OR (NEW.is_featured IS DISTINCT FROM OLD.is_featured) THEN
    IF NOT (is_admin() OR auth.role() = 'service_role') THEN
      RAISE EXCEPTION 'validation_status et is_featured ne peuvent être modifiés que par un administrateur (escalade de privilège bloquée).'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_company_admin_columns
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_company_admin_columns();
