/**
 * GET /api/observatoire/geo
 *
 * Répartition géographique des talents tech marocains sur APEBI TechTalent.
 *
 * Exemple de réponse :
 * {
 *   "meta": { ... },
 *   "distribution": [{ "city": "Casablanca", "talent_count": 120 }]
 * }
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkObservatoireThreshold, observatoireApiGate, publicApiHeaders } from '../_shared'

export const revalidate = 3600

export async function GET() {
  const gated = observatoireApiGate()
  if (gated) return gated

  const blocked = await checkObservatoireThreshold()
  if (blocked) return blocked

  // Vue mv_* non exposée à l'API Data (A0-3) → lecture via service-role serveur.
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('mv_geo_distribution')
    .select('city, talent_count')
    .order('talent_count', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[api/observatoire/geo]', error.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  return NextResponse.json(
    {
      meta: {
        generated_at: new Date().toISOString(),
        source: 'APEBI TechTalent — Commission Sectorielle Formation & Tech Talents',
        attribution: 'Données issues de la plateforme APEBI TechTalent. Citer "APEBI TechTalent" comme source.',
      },
      distribution: data,
    },
    { headers: publicApiHeaders() },
  )
}

export async function OPTIONS() {
  const gated = observatoireApiGate()
  if (gated) return gated
  return new NextResponse(null, { status: 204, headers: publicApiHeaders() })
}
