// ============================================================
// Edge Function : refresh-observatoire (T7)
// ============================================================
// Rafraîchit les vues matérialisées de l'Observatoire en appelant
// la fonction SQL refresh_observatoire(). Sert de mécanisme de refresh
// planifié quand pg_cron n'est pas disponible (ex: free tier sans cron),
// ou comme déclencheur manuel.
//
// Planification : Supabase Scheduled Functions, ou cron externe POST.
// Protection : header Authorization Bearer ${CRON_SECRET} (sinon 401).
//
// Déploiement : supabase functions deploy refresh-observatoire
// Secret      : supabase secrets set CRON_SECRET=<aléatoire>
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // ── Garde : secret partagé obligatoire ──
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

  const { error } = await supabase.rpc('refresh_observatoire')
  if (error) {
    console.error('[refresh-observatoire] RPC error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({ success: true, refreshed_at: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
