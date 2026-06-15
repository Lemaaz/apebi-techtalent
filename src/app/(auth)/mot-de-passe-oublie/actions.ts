// src/app/(auth)/mot-de-passe-oublie/actions.ts
'use server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export type ResetPasswordState = { error: string | null; success: boolean }

const schema = z.object({
  email: z.string().email('Email invalide'),
})

export async function resetPassword(
  _: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = schema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Email invalide', success: false }
  }

  const headersList = await headers()
  const origin = headersList.get('origin') ?? ''

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  })

  // Ne pas révéler si l'email existe ou non (sécurité)
  if (error) console.error('[resetPassword]', error.message)
  return { error: null, success: true }
}
