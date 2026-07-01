'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { translateAuthError } from '@/lib/supabase/auth-errors'
import { logFunnel } from '@/lib/funnel'

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

  // Signal de rétention — connexion réussie (avant le redirect qui throw)
  if (user) logFunnel('connexion', { userId: user.id })

  const userMeta = user?.user_metadata?.role as string | undefined
  const appMeta = (user as any)?.app_metadata?.role as string | undefined
  const role = appMeta === 'SUPER_ADMIN' || appMeta === 'ADMIN' ? appMeta : userMeta

  // Validate redirect to prevent open redirect
  const defaultDest =
    role === 'SUPER_ADMIN' || role === 'ADMIN' ? '/admin'
    : role === 'entreprise' ? '/entreprise/dashboard'
    : '/talent/profil'

  const safeRedirect =
    redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : defaultDest

  redirect(safeRedirect)
}
