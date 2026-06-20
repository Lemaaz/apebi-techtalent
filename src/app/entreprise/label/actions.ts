'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ── Candidature d'une entreprise au Label APEBI TechTalent ──
// Un membre (recruteur) candidate au nom de son entreprise.
// Policy RLS company_own_label_app autorise l'insert (status borné).

export async function applyForCompanyLabel() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id, company_profiles ( validation_status )')
    .eq('user_id', user.id)
    .maybeSingle<{
      company_id: string
      company_profiles: { validation_status: string } | null
    }>()

  if (!membership) throw new Error('Aucune entreprise associée à votre compte.')
  if (membership.company_profiles?.validation_status !== 'approved') {
    throw new Error('Votre entreprise doit être validée avant de candidater au Label.')
  }

  const { error } = await supabase.from('label_applications').insert({
    company_id: membership.company_id,
    applicant_type: 'enterprise',
    status: 'submitted',
    submitted_at: new Date().toISOString(),
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error('Votre entreprise a déjà un dossier de Label en cours.')
    }
    throw new Error(error.message)
  }

  revalidatePath('/entreprise/label')
}
