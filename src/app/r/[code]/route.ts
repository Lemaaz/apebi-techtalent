import { NextRequest, NextResponse } from 'next/server'
import { REF_COOKIE } from '@/lib/referral'

// Lien de parrainage : /r/<code> → pose le cookie d'attribution puis redirige
// vers l'accueil (l'invité choisit ensuite talent ou entreprise, le cookie suit).
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> },
): Promise<NextResponse> {
  const { code } = await ctx.params

  const url = new URL('/?bienvenue=1', req.url)
  const res = NextResponse.redirect(url)

  // Code plausible uniquement (8 alphanum) — évite de stocker n'importe quoi
  if (/^[A-Z0-9]{6,12}$/i.test(code)) {
    res.cookies.set(REF_COOKIE, code.toUpperCase(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 jours
      path: '/',
    })
  }

  return res
}
