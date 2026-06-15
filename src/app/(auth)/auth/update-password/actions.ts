// src/app/(auth)/auth/update-password/actions.ts
'use server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UpdatePasswordState = { error: string | null }

const schema = z
  .object({
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  })

export async function updatePassword(
  _: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const parsed = schema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) return { error: 'Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré.' }

  redirect('/connexion?message=password-updated')
}
