import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { matchJobsToTalent } from '@/lib/ai-matching'

export const maxDuration = 60

// POST (pas GET) : cette route mute l'état (increment_matching_quota).
// GET+cookie-session-auth serait rejouable via une simple navigation
// cross-site (SameSite=Lax exempte les GET de navigation top-level) —
// POST profite de la protection CSRF réelle de SameSite=Lax sur les cookies.
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: talent } = await supabase
      .from('talent_profiles')
      .select('id, validation_status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!talent) return NextResponse.json({ error: 'Profil talent introuvable' }, { status: 404 })
    if (talent.validation_status !== 'approved') {
      return NextResponse.json({ error: 'Profil non encore validé' }, { status: 403 })
    }

    // Quota journalier par user (protège le coût Claude — distribué via DB)
    const DAILY_LIMIT = 30
    const { data: quota, error: quotaErr } = await supabase.rpc('increment_matching_quota', {
      p_user_id: user.id,
    })
    if (!quotaErr && (quota as number) > DAILY_LIMIT) {
      return NextResponse.json(
        { error: `Limite journalière de ${DAILY_LIMIT} requêtes matching atteinte. Réessayez demain.` },
        { status: 429 },
      )
    }

    const results = await matchJobsToTalent(talent.id)
    return NextResponse.json({ results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne'
    console.error('[matching/talent]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
