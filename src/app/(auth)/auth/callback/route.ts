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

  // next param → reset mot de passe
  if (next) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Pas de next → confirmation email → rediriger selon le rôle
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role as string | undefined
  const destination = role === 'entreprise' ? '/entreprise/dashboard' : '/talent/profil'

  return NextResponse.redirect(`${origin}${destination}`)
}
