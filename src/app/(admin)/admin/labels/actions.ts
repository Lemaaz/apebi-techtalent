'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// ── Examen d'un dossier de Label APEBI TechTalent (T-Label, admin) ──
// Approbation → met à jour le dossier ET active le badge sur le profil
// (has_techtalent_label + label_valid_until +1 an + label_qr_token).
// Écriture des colonnes Label via le client service-role : autorisé par
// le trigger guard_label_columns (bypass service_role). Cross-user → RLS
// admin requise de toute façon.

type LabelAction = 'approve' | 'reject' | 'under_review'

export async function reviewLabel(
  applicationId: string,
  action: LabelAction,
  note?: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) throw new Error('Accès refusé')

  const { data: app } = await supabase
    .from('label_applications')
    .select('id, talent_id, company_id, applicant_type, status')
    .eq('id', applicationId)
    .maybeSingle<{
      id: string
      talent_id: string | null
      company_id: string | null
      applicant_type: 'talent' | 'enterprise'
      status: string
    }>()

  if (!app) throw new Error('Dossier introuvable')

  const admin = createAdminClient()
  const now = new Date().toISOString()

  if (action === 'under_review') {
    await admin
      .from('label_applications')
      .update({ status: 'under_review', reviewed_at: now, reviewer_id: user.id })
      .eq('id', applicationId)
    revalidatePath('/admin/labels')
    return
  }

  if (action === 'reject') {
    await admin
      .from('label_applications')
      .update({
        status: 'rejected',
        reviewed_at: now,
        reviewer_id: user.id,
        notes_admin: note ?? null,
      })
      .eq('id', applicationId)
    revalidatePath('/admin/labels')
    return
  }

  // ── approve ──
  const token = randomUUID()
  const validUntil = new Date()
  validUntil.setFullYear(validUntil.getFullYear() + 1)
  const validUntilStr = validUntil.toISOString().slice(0, 10)

  await admin
    .from('label_applications')
    .update({
      status: 'approved',
      reviewed_at: now,
      reviewer_id: user.id,
      notes_admin: note ?? null,
    })
    .eq('id', applicationId)

  // Active le badge sur le profil concerné
  if (app.applicant_type === 'talent' && app.talent_id) {
    await admin
      .from('talent_profiles')
      .update({
        has_techtalent_label: true,
        label_valid_until: validUntilStr,
        label_qr_token: token,
      })
      .eq('id', app.talent_id)
  } else if (app.applicant_type === 'enterprise' && app.company_id) {
    await admin
      .from('company_profiles')
      .update({
        has_techtalent_label: true,
        label_valid_until: validUntilStr,
        label_qr_token: token,
      })
      .eq('id', app.company_id)
  }

  revalidatePath('/admin/labels')
  revalidatePath('/entreprises') // badges sur les vitrines publiques
}
