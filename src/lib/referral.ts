import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logFunnel } from '@/lib/funnel'

export const REF_COOKIE = 'apebi_ref'

// Code court partageable (8 caractères, dérivé d'un uuid).
function genCode(): string {
  return randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
}

export type ReferralStats = { code: string; url: string; invitedCount: number }

// Renvoie (et crée à la demande) le code de parrainage de l'utilisateur courant,
// + le nombre de filleuls ayant rejoint. Null si non authentifié.
export async function getReferralStats(): Promise<ReferralStats | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  // Code existant ?
  let code: string | null = null
  const { data: existing } = await admin
    .from('referral_codes')
    .select('code')
    .eq('user_id', user.id)
    .maybeSingle<{ code: string }>()

  if (existing?.code) {
    code = existing.code
  } else {
    // Génère avec quelques tentatives en cas de collision
    for (let i = 0; i < 5 && !code; i++) {
      const candidate = genCode()
      const { error } = await admin
        .from('referral_codes')
        .insert({ user_id: user.id, code: candidate })
      if (!error) code = candidate
    }
    if (!code) code = genCode() // dernier recours (collision quasi impossible)
  }

  const { count } = await admin
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_user_id', user.id)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://apebi-techtalent.vercel.app'
  return { code, url: `${appUrl}/r/${code}`, invitedCount: count ?? 0 }
}

// À appeler après la création d'un profil (talent ou entreprise) : lit le cookie
// de parrainage, résout le parrain, enregistre l'attribution. Non-bloquant.
export async function recordReferralConversion(
  referredUserId: string,
  role: 'talent' | 'entreprise',
): Promise<void> {
  try {
    const cookieStore = await cookies()
    const code = cookieStore.get(REF_COOKIE)?.value
    if (!code) return

    const admin = createAdminClient()
    const { data: referrer } = await admin
      .from('referral_codes')
      .select('user_id')
      .eq('code', code)
      .maybeSingle<{ user_id: string }>()

    // Efface le cookie quoi qu'il arrive (usage unique)
    cookieStore.delete(REF_COOKIE)

    // Auto-parrainage impossible / code inconnu → on s'arrête
    if (!referrer?.user_id || referrer.user_id === referredUserId) return

    const { error } = await admin.from('referrals').insert({
      referrer_user_id: referrer.user_id,
      referred_user_id: referredUserId,
      referred_role: role,
    })
    // UNIQUE(referred_user_id) : si déjà parrainé, on ignore
    if (!error) {
      logFunnel('parrainage_converti', { userId: referredUserId })
    }
  } catch (e) {
    console.error('[referral] recordConversion', e)
  }
}
