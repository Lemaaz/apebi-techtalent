'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendAccountStatusEmail } from '@/lib/email'

export async function validateTalent(talentId: string, action: 'approved' | 'rejected' | 'pending', note?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) throw new Error('Accès refusé')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('user_id')
    .eq('id', talentId)
    .maybeSingle()

  await supabase
    .from('talent_profiles')
    .update({
      validation_status: action,
      validation_note: note ?? null,
      visibility: action === 'approved',
    })
    .eq('id', talentId)

  revalidatePath('/admin/talents')

  // NOT-01 — email de notification au talent
  if (talent?.user_id && (action === 'approved' || action === 'rejected')) {
    try {
      await sendAccountStatusEmail({
        userId: talent.user_id,
        role: 'talent',
        status: action,
        reason: action === 'rejected' ? (note ?? null) : null,
      })
    } catch (emailErr) {
      console.error('[validateTalent] email error (non-blocking):', emailErr)
    }
  }
}

export async function deactivateTalent(talentId: string): Promise<{ error?: string }> {
  // Verify caller is admin
  const anonClient = await createClient()
  const { data: { user: caller } } = await anonClient.auth.getUser()
  if (!caller) return { error: 'Non authentifié.' }
  const { data: isAdmin } = await anonClient.rpc('is_admin')
  if (!isAdmin) return { error: 'Accès refusé.' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('talent_profiles')
    .update({ validation_status: 'rejected', visibility: false })
    .eq('id', talentId)
  if (error) return { error: error.message }
  revalidatePath('/admin/talents')
  return {}
}
