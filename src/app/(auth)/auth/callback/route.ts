// src/app/(auth)/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? null

  if (!code) {
    return NextResponse.redirect(`${origin}/connexion?error=lien-invalide`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback]', error.message)
    return NextResponse.redirect(`${origin}/connexion?error=lien-expire`)
  }

  // next param → reset mot de passe (validate to prevent open redirect)
  const safeNext = next && next.startsWith('/') && !next.startsWith('//')
    ? next
    : null
  if (safeNext) {
    return NextResponse.redirect(`${origin}${safeNext}`)
  }

  // Pas de next → confirmation email → rediriger selon le rôle
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role as string | undefined

  // OAuth sans rôle défini → onboarding obligatoire (bug A2)
  if (!role) {
    return NextResponse.redirect(`${origin}/onboarding/choix-role`)
  }

  const destination =
    role === 'SUPER_ADMIN' || role === 'ADMIN' ? '/admin'
    : role === 'entreprise' ? '/entreprise/dashboard'
    : '/talent/profil'
  return NextResponse.redirect(`${origin}${destination}`)
}
