'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function promoteToAdmin(formData: FormData): Promise<{ error?: string; success?: string }> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return { error: 'Email invalide.' }
  }

  const supabase = await createAdminClient()

  // Find user by email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) return { error: 'Erreur lors de la recherche de l\'utilisateur.' }

  const target = users.find((u) => u.email?.toLowerCase() === email)
  if (!target) return { error: 'Aucun utilisateur trouvé avec cet email.' }

  // Check not already SUPER_ADMIN
  if (target.user_metadata?.role === 'SUPER_ADMIN') {
    return { error: 'Cet utilisateur est déjà Super Admin.' }
  }

  // Promote to ADMIN
  const { error: updateError } = await supabase.auth.admin.updateUserById(target.id, {
    user_metadata: { ...target.user_metadata, role: 'ADMIN' },
  })

  if (updateError) return { error: 'Erreur lors de la promotion : ' + updateError.message }

  revalidatePath('/admin/super')
  return { success: `${email} a été promu Admin APEBI avec succès.` }
}
