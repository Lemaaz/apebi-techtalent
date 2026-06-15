'use server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { translateAuthError } from '@/lib/supabase/auth-errors'
import { headers } from 'next/headers'

export type SignUpState = { error: string | null; success: boolean }

const schema = z
  .object({
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirm: z.string(),
    role: z.enum(['talent', 'entreprise']),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  })

export async function signUp(
  _: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
    role: formData.get('role'),
  })

  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first?.message ?? 'Données invalides', success: false }
  }

  const { email, password, role } = parsed.data

  const headersList = await headers()
  const origin = headersList.get('origin') ?? ''

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) return { error: translateAuthError(error.message), success: false }
  return { error: null, success: true }
}
