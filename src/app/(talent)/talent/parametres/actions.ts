'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
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

// ── Basculer la visibilité du profil ─────────────────────────

export async function toggleVisibilityFromParams(current: boolean): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  await supabase
    .from('talent_profiles')
    .update({ visibility: !current })
    .eq('user_id', user.id)

  revalidatePath('/talent/parametres')
  revalidatePath('/talent/profil')
}

// ── Supprimer le compte ───────────────────────────────────────

const deleteSchema = z.object({
  confirmation: z.literal('SUPPRIMER', {
    error: 'Tapez exactement SUPPRIMER pour confirmer',
  }),
})

export type DeleteState = { error: string | null }

export async function deleteAccount(
  _: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const parsed = deleteSchema.safeParse({ confirmation: formData.get('confirmation') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Confirmation invalide' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Delete talent profile first (cascades to related data via FK)
  await supabase.from('talent_profiles').delete().eq('user_id', user.id)

  // Delete auth user via service role
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(user.id)
  if (error) return { error: 'Erreur lors de la suppression. Contactez le support.' }

  // Sign out and redirect
  await supabase.auth.signOut()
  redirect('/?compte=supprime')
}
