'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ── Candidature d'un talent au Label APEBI TechTalent ──
// Crée un dossier label_applications (status 'submitted'). La policy RLS
// talent_own_label_app autorise l'insert (status borné à draft/submitted).
// L'index unique partiel empêche un second dossier actif (non rejeté).

export async function applyForTalentLabel() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id, validation_status, completeness_score')
    .eq('user_id', user.id)
    .maybeSingle<{ id: string; validation_status: string; completeness_score: number }>()

  if (!talent) throw new Error('Profil introuvable')
  if (talent.validation_status !== 'approved') {
    throw new Error('Votre profil doit être validé avant de candidater au Label.')
  }
  if (talent.completeness_score < 70) {
    throw new Error('Complétez votre profil à au moins 70 % pour candidater au Label.')
  }

  const { error } = await supabase.from('label_applications').insert({
    talent_id: talent.id,
    applicant_type: 'talent',
    status: 'submitted',
    submitted_at: new Date().toISOString(),
  })

  if (error) {
    // Conflit d'index unique = dossier actif déjà existant
    if (error.code === '23505') {
      throw new Error('Vous avez déjà un dossier de Label en cours.')
    }
    throw new Error(error.message)
  }

  revalidatePath('/talent/label')
}
