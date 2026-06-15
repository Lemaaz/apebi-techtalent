'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { translateAuthError } from '@/lib/supabase/auth-errors'

export type SignInState = { error: string | null }

export async function signIn(
  _: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirect') as string | null

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: translateAuthError(error.message) }

  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role as string | undefined

  // Validate redirect to prevent open redirect
  const safeRedirect =
    redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : role === 'entreprise'
        ? '/entreprise/dashboard'
        : '/talent/profil'

  redirect(safeRedirect)
}
