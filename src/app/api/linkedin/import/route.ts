import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
// OIDC userinfo endpoint — works with openid+profile+email scopes (Standard Tier)
const USERINFO_URL = 'https://api.linkedin.com/v2/userInfo'

type LinkedInTokenResponse = {
  access_token: string
  expires_in: number
}

type LinkedInUserInfo = {
  sub: string
  name: string
  given_name: string
  family_name: string
  picture?: string
  email?: string
  email_verified?: boolean
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const profileEditUrl = `${APP_URL}/talent/profil/modifier`

  // ── Error from LinkedIn ──────────────────────────────────
  if (error) {
    const desc = searchParams.get('error_description') ?? error
    return NextResponse.redirect(`${profileEditUrl}?linkedin_error=${encodeURIComponent(desc)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${profileEditUrl}?linkedin_error=missing_params`)
  }

  // ── CSRF state validation ────────────────────────────────
  const cookieState = req.cookies.get('linkedin_oauth_state')?.value
  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(`${profileEditUrl}?linkedin_error=invalid_state`)
  }

  let statePayload: { userId: string; ts: number }
  try {
    statePayload = JSON.parse(Buffer.from(state, 'base64url').toString())
  } catch {
    return NextResponse.redirect(`${profileEditUrl}?linkedin_error=invalid_state`)
  }

  // State must be fresh (< 10 min)
  if (Date.now() - statePayload.ts > 10 * 60 * 1000) {
    return NextResponse.redirect(`${profileEditUrl}?linkedin_error=state_expired`)
  }

  // ── Check authenticated user matches state ───────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== statePayload.userId) {
    return NextResponse.redirect(`${profileEditUrl}?linkedin_error=auth_mismatch`)
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${profileEditUrl}?linkedin_error=not_configured`)
  }

  // ── Exchange code for token ──────────────────────────────
  const redirectUri = `${APP_URL}/api/linkedin/import`

  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!tokenRes.ok) {
    console.error('[linkedin] Token exchange failed:', await tokenRes.text())
    return NextResponse.redirect(`${profileEditUrl}?linkedin_error=token_exchange_failed`)
  }

  const { access_token }: LinkedInTokenResponse = await tokenRes.json()

  // ── Fetch OIDC userinfo (openid + profile + email) ─────────
  const userInfoRes = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (!userInfoRes.ok) {
    console.error('[linkedin] UserInfo fetch failed:', userInfoRes.status)
    return NextResponse.redirect(`${profileEditUrl}?linkedin_error=profile_fetch_failed`)
  }

  const userInfo: LinkedInUserInfo = await userInfoRes.json()

  // ── Download + upload profile picture ───────────────────
  let avatarUrl: string | undefined
  if (userInfo.picture) {
    try {
      const photoRes = await fetch(userInfo.picture)
      if (photoRes.ok) {
        const photoBuffer = await photoRes.arrayBuffer()
        const path = `${user.id}/${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, photoBuffer, { contentType: 'image/jpeg', upsert: true })

        if (!uploadError) {
          avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
        }
      }
    } catch (e) {
      console.warn('[linkedin] Photo upload failed:', e)
    }
  }

  const { error: upsertError } = await supabase
    .from('talent_profiles')
    .update({
      first_name: userInfo.given_name,
      last_name: userInfo.family_name,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq('user_id', user.id)

  if (upsertError) {
    console.error('[linkedin] Profile update failed:', upsertError.message)
    return NextResponse.redirect(`${profileEditUrl}?linkedin_error=profile_update_failed`)
  }

  // Clear the state cookie and redirect to profile editor
  const res = NextResponse.redirect(`${profileEditUrl}?linkedin_imported=1`)
  res.cookies.set('linkedin_oauth_state', '', { maxAge: 0, path: '/' })
  return res
}
