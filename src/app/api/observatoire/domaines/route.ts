/**
 * GET /api/observatoire/domaines
 *
 * Activité par domaine de compétences tech : nombre d'offres actives
 * et de talents approuvés par domaine APEBI.
 *
 * Exemple de réponse :
 * {
 *   "meta": { ... },
 *   "domaines": [{ "code": "DEV", "name_fr": "Développement logiciel", "active_jobs": 18, "approved_talents": 95 }]
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
    .from('mv_domain_activity')
    .select('code, name_fr, active_jobs, approved_talents')
    .order('code', { ascending: true })

  if (error) {
    console.error('[api/observatoire/domaines]', error.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  return NextResponse.json(
    {
      meta: {
        generated_at: new Date().toISOString(),
        source: 'APEBI TechTalent — Commission Sectorielle Formation & Tech Talents',
        attribution: 'Données issues de la plateforme APEBI TechTalent. Citer "APEBI TechTalent" comme source.',
      },
      domaines: data,
    },
    { headers: publicApiHeaders() },
  )
}

export async function OPTIONS() {
  const gated = observatoireApiGate()
  if (gated) return gated
  return new NextResponse(null, { status: 204, headers: publicApiHeaders() })
}
