'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendAccountStatusEmail } from '@/lib/email'

export async function validateCompany(companyId: string, action: 'approved' | 'rejected' | 'pending', note?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) throw new Error('Accès refusé')

  const { data: member } = await supabase
    .from('company_members')
    .select('user_id')
    .eq('company_id', companyId)
    .maybeSingle()

  await supabase
    .from('company_profiles')
    .update({
      validation_status: action,
      validation_note: note ?? null,
    })
    .eq('id', companyId)

  revalidatePath('/admin/entreprises')

  // NOT-01 — email de notification au recruteur principal
  if (member?.user_id && (action === 'approved' || action === 'rejected')) {
    try {
      await sendAccountStatusEmail({
        userId: member.user_id,
        role: 'entreprise',
        status: action,
        reason: action === 'rejected' ? (note ?? null) : null,
      })
    } catch (emailErr) {
      console.error('[validateCompany] email error (non-blocking):', emailErr)
    }
  }
}
