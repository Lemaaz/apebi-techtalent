// ============================================================
// Label APEBI TechTalent — vérification publique par token (T4)
// ============================================================
// Logique partagée entre la route API /api/label/verify/[token]
// et la page publique /label/verify/[token].
//
// Lecture via le client service-role (createAdminClient) car les
// profils talents ne sont pas lisibles publiquement par RLS. On ne
// renvoie que des champs publics non sensibles (type, nom, validité).
//
// ⚠️ Requiert `supabase gen types` après application des migrations
//    005 (label_qr_token) pour que les types reflètent les colonnes.

import { createAdminClient } from '@/lib/supabase/server'

export type LabelStatus = 'valid' | 'expired' | 'revoked'

export type LabelVerification = {
  type: 'enterprise' | 'talent'
  name: string
  status: LabelStatus
  validUntil: string | null
}

// UUID v4 (format des tokens gen_random_uuid)
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function computeStatus(hasLabel: boolean, validUntil: string | null): LabelStatus {
  if (!hasLabel) return 'revoked'
  if (validUntil && new Date(validUntil) < new Date(new Date().toDateString())) {
    return 'expired'
  }
  return 'valid'
}

/**
 * Vérifie un token de Label. Retourne null si le token est invalide
 * (mauvais format) ou introuvable. Sinon, le statut public du Label.
 */
export async function verifyLabelToken(
  token: string,
): Promise<LabelVerification | null> {
  if (!UUID_RE.test(token)) return null

  const db = createAdminClient()

  // 1. Entreprise
  const { data: company } = await db
    .from('company_profiles')
    .select('name, has_techtalent_label, label_valid_until')
    .eq('label_qr_token', token)
    .maybeSingle<{
      name: string
      has_techtalent_label: boolean
      label_valid_until: string | null
    }>()

  if (company) {
    return {
      type: 'enterprise',
      name: company.name,
      status: computeStatus(company.has_techtalent_label, company.label_valid_until),
      validUntil: company.label_valid_until,
    }
  }

  // 2. Talent
  const { data: talent } = await db
    .from('talent_profiles')
    .select('first_name, last_name, has_techtalent_label, label_valid_until')
    .eq('label_qr_token', token)
    .maybeSingle<{
      first_name: string
      last_name: string
      has_techtalent_label: boolean
      label_valid_until: string | null
    }>()

  if (talent) {
    return {
      type: 'talent',
      name: `${talent.first_name} ${talent.last_name}`,
      status: computeStatus(talent.has_techtalent_label, talent.label_valid_until),
      validUntil: talent.label_valid_until,
    }
  }

  return null
}
