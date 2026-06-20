'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { translateAuthError } from '@/lib/supabase/auth-errors'

// ── Changer le mot de passe ───────────────────────────────────

const pwdSchema = z
  .object({
    password: z.string().min(8, 'Au moins 8 caractères requis'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  })

export type PwdState = { error: string | null; success: boolean }

export async function changePassword(
  _: PwdState,
  formData: FormData,
): Promise<PwdState> {
  const parsed = pwdSchema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Données invalides', success: false }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: translateAuthError(error.message), success: false }

  return { error: null, success: true }
}

// ── Basculer la préférence de notification ────────────────────

export type NotifyState = { error: string | null; success: boolean }

export async function toggleNotifyOnApplication(
  _: NotifyState,
  formData: FormData,
): Promise<NotifyState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Checkbox sends 'on' when checked, nothing when unchecked
  const notify = formData.get('notify_on_application') === 'on'

  const { error } = await supabase
    .from('company_members')
    .update({ notify_on_application: notify })
    .eq('user_id', user.id)

  if (error) {
    console.error('[parametres/actions] toggleNotify error:', error.message)
    return { error: 'Erreur lors de la sauvegarde. Réessayez.', success: false }
  }

  revalidatePath('/entreprise/parametres')
  return { error: null, success: true }
}
