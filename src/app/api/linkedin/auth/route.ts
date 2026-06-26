import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization'
// OIDC scopes via "Sign In with LinkedIn using OpenID Connect" (Standard Tier)
const SCOPES = 'openid profile email'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/connexion', req.url))
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'LinkedIn non configuré' }, { status: 503 })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/linkedin/import`
  const state = Buffer.from(JSON.stringify({ userId: user.id, ts: Date.now() })).toString('base64url')

  const url = new URL(LINKEDIN_AUTH_URL)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)
  url.searchParams.set('scope', SCOPES)

  const res = NextResponse.redirect(url.toString())
  // Store state in a short-lived cookie for CSRF validation
  res.cookies.set('linkedin_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 min
    path: '/',
  })
  return res
}
