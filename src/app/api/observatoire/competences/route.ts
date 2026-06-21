/**
 * GET /api/observatoire/competences
 *
 * Retourne les compétences les plus demandées et les plus déclarées
 * dans l'écosystème APEBI TechTalent.
 *
 * Exemple de réponse :
 * {
 *   "meta": { "generated_at": "...", "source": "APEBI TechTalent" },
 *   "demand": [{ "name": "React", "domain_code": "DEV", "demand_count": 42 }],
 *   "supply": [{ "name": "React", "domain_code": "DEV", "supply_count": 38 }]
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

  // Vues mv_* non exposées à l'API Data (A0-3) → lecture via service-role serveur.
  const supabase = createAdminClient()

  const [demand, supply] = await Promise.all([
    supabase
      .from('mv_skills_demand')
      .select('name, domain_code, demand_count')
      .order('demand_count', { ascending: false })
      .limit(20),
    supabase
      .from('mv_skills_supply')
      .select('name, domain_code, supply_count')
      .order('supply_count', { ascending: false })
      .limit(20),
  ])

  if (demand.error || supply.error) {
    console.error('[api/observatoire/competences]', demand.error?.message ?? supply.error?.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  return NextResponse.json(
    {
      meta: {
        generated_at: new Date().toISOString(),
        source: 'APEBI TechTalent — Commission Sectorielle Formation & Tech Talents',
        attribution: 'Données issues de la plateforme APEBI TechTalent. Citer "APEBI TechTalent" comme source.',
      },
      demand: demand.data,
      supply: supply.data,
    },
    { headers: publicApiHeaders() },
  )
}

export async function OPTIONS() {
  const gated = observatoireApiGate()
  if (gated) return gated
  return new NextResponse(null, { status: 204, headers: publicApiHeaders() })
}
