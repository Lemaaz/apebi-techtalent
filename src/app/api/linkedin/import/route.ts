import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const PROFILE_URL = 'https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,localizedHeadline,profilePicture(displayImage~:playableStreams))'
const EMAIL_URL = 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))'

type LinkedInTokenResponse = {
  access_token: string
  expires_in: number
}

type LinkedInProfile = {
  id: string
  localizedFirstName: string
  localizedLastName: string
  localizedHeadline?: string
  profilePicture?: {
    'displayImage~'?: {
      elements?: Array<{
        authorizationMethod: string
        identifiers?: Array<{ identifier: string; identifierType: string }>
      }>
    }
  }
}

type LinkedInEmailResponse = {
  elements?: Array<{
    'handle~'?: { emailAddress?: string }
  }>
}

function extractProfilePhoto(profile: LinkedInProfile): string | null {
  const elements = profile.profilePicture?.['displayImage~']?.elements
  if (!elements || elements.length === 0) return null
  // Get the largest image (last element)
  const largest = elements[elements.length - 1]
  const identifier = largest?.identifiers?.find(
    (id) => id.identifierType === 'EXTERNAL_URL',
  )
  return identifier?.identifier ?? null
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

  // ── Fetch profile + email in parallel ───────────────────
  const [profileRes, emailRes] = await Promise.all([
    fetch(PROFILE_URL, { headers: { Authorization: `Bearer ${access_token}` } }),
    fetch(EMAIL_URL, { headers: { Authorization: `Bearer ${access_token}` } }),
  ])

  if (!profileRes.ok) {
    console.error('[linkedin] Profile fetch failed:', profileRes.status)
    return NextResponse.redirect(`${profileEditUrl}?linkedin_error=profile_fetch_failed`)
  }

  const profile: LinkedInProfile = await profileRes.json()
  const emailData: LinkedInEmailResponse = emailRes.ok ? await emailRes.json() : {}

  const linkedinEmail = emailData.elements?.[0]?.['handle~']?.emailAddress ?? null
  const photoUrl = extractProfilePhoto(profile)

  // ── Upsert talent profile with LinkedIn data ─────────────
  let avatarUrl: string | undefined
  if (photoUrl) {
    try {
      const photoRes = await fetch(photoUrl)
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
      first_name: profile.localizedFirstName,
      last_name: profile.localizedLastName,
      ...(profile.localizedHeadline ? { title: profile.localizedHeadline } : {}),
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
