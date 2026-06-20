// ============================================================
// Edge Function : expire-jobs (OFF-10)
// ============================================================
// Ferme les offres actives dont closes_at est dépassé.
// Sert de fallback quand pg_cron n'est pas disponible (free tier).
//
// Planification : Supabase Scheduled Functions ou cron externe POST.
// Protection   : header Authorization Bearer ${CRON_SECRET} (sinon 401).
//
// Déploiement : supabase functions deploy expire-jobs
// Secret      : supabase secrets set CRON_SECRET=<même secret que refresh-observatoire>
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // ── Garde : secret partagé obligatoire ──────────────────────
  const cronSecret = Deno.env.get('CRON_SECRET')
  const authHeader = req.headers.get('Authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Configuration serveur manquante' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabase.rpc('close_expired_job_postings')

  if (error) {
    console.error('[expire-jobs] RPC error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const closedCount = data as number ?? 0
  console.log(`[expire-jobs] ${closedCount} offres fermées.`)

  return new Response(
    JSON.stringify({ success: true, closed: closedCount }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
