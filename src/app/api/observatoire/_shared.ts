/**
 * Shared utilities for the Observatoire public API (E8 — CEO review 21/06/2026)
 *
 * The API is gated on representativeness thresholds:
 *   THRESHOLD_TALENTS = 200 validated talents
 *   THRESHOLD_JOBS    = 100 active offers
 *
 * Below threshold → 503 with a message explaining when data will be available.
 * Above threshold → JSON data from materialized views (same source as /observatoire page).
 *
 * Rate limiting is handled upstream by proxy.ts (10 req/min on /api/matching/*,
 * no rule yet for /api/observatoire — add one if abuse occurs).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const THRESHOLD_TALENTS = 200
export const THRESHOLD_JOBS = 100

/**
 * Feature flag — l'API publique JSON de l'Observatoire reste DÉSACTIVÉE par
 * défaut tant que le rate limiting (INF-08) n'est pas en place. Une API publique
 * non authentifiée, CORS `*`, sans limite de débit = vecteur d'abus.
 *
 * Activer en posant `OBSERVATOIRE_PUBLIC_API=true` côté Vercel quand INF-08 est fait.
 * Tant que désactivée, on renvoie un 404 (on n'expose pas l'existence de l'endpoint).
 */
export function observatoireApiGate(): NextResponse | null {
  if (process.env.OBSERVATOIRE_PUBLIC_API === 'true') return null
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

/** Check thresholds and return 503 response if below. Returns null if above. */
export async function checkObservatoireThreshold(): Promise<NextResponse | null> {
  const supabase = await createClient()

  const [{ count: talentCount }, { count: jobCount }] = await Promise.all([
    supabase
      .from('talent_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('validation_status', 'approved'),
    supabase
      .from('job_postings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  const talents = talentCount ?? 0
  const jobs = jobCount ?? 0

  if (talents < THRESHOLD_TALENTS || jobs < THRESHOLD_JOBS) {
    return NextResponse.json(
      {
        error: 'Données non disponibles',
        message: `L'Observatoire APEBI TechTalent sera activé dès ${THRESHOLD_TALENTS} talents validés et ${THRESHOLD_JOBS} offres actives. État actuel : ${talents} talents / ${jobs} offres.`,
        threshold: { talents: THRESHOLD_TALENTS, jobs: THRESHOLD_JOBS },
        current: { talents, jobs },
      },
      {
        status: 503,
        headers: {
          'Retry-After': '86400',
          'Cache-Control': 'no-store',
        },
      },
    )
  }

  return null
}

/** Standard CORS + cache headers for public API endpoints */
export function publicApiHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    'X-Data-Source': 'APEBI TechTalent — Commission Sectorielle Formation & Tech Talents',
  }
}
