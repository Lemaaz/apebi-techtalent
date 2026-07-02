-- ============================================================
-- APEBI TechTalent — Migration 031 : une entreprise en attente
-- doit pouvoir voir (et donc éditer) son propre profil
-- ============================================================
-- Bug non intentionnel repéré pendant l'audit sécurité du
-- 2026-07-02 : company_profiles n'avait qu'une policy SELECT
-- (public_read_approved_companies, validation_status='approved')
-- et une policy UPDATE séparée pour les membres
-- (members_update_company, is_company_member(id)) — mais AUCUNE
-- policy SELECT ne couvrait "un membre voit sa propre entreprise
-- quel que soit son statut".
--
-- En RLS Postgres, une policy UPDATE seule ne suffit pas : la ligne
-- doit d'abord être visible via une policy SELECT permissive pour
-- que Postgres la "trouve" et applique la policy UPDATE. Résultat :
-- une entreprise fraîchement inscrite (statut 'pending' par défaut)
-- ne pouvait éditer AUCUN champ de son propre profil tant qu'un
-- admin ne l'avait pas approuvée — vérifié en direct (0 ligne
-- affectée sur une simple mise à jour de champ anodin).
--
-- Toutes les autres tables du même type (applications, saved_talents)
-- ont déjà une policy SELECT dédiée avec le même scope que leur
-- policy d'écriture — company_profiles était la seule exception,
-- un oubli, pas un choix de sécurité voulu.
-- ============================================================

CREATE POLICY "members_read_own_company" ON company_profiles
  FOR SELECT
  USING (is_company_member(id));
