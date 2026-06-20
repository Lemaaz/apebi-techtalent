'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ── REC-03 : Sauvegarder / retirer un talent des favoris ─────

export async function toggleSavedTalent(talentId: string, isSaved: boolean): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: member } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return

  if (isSaved) {
    await supabase
      .from('saved_talents')
      .delete()
      .eq('company_id', member.company_id)
      .eq('talent_id', talentId)
  } else {
    await supabase
      .from('saved_talents')
      .insert({ company_id: member.company_id, talent_id: talentId })
  }

  revalidatePath('/entreprise/recherche-talents')
  revalidatePath(`/entreprise/talents/${talentId}`)
  revalidatePath('/entreprise/favoris')
}
