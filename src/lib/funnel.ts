import { createAdminClient } from '@/lib/supabase/server'

export type FunnelEventType =
  | 'inscription'
  | 'candidature_envoyee'
  | 'candidature_vue'
  | 'profil_vu'
  | 'invitation_envoyee'
  | 'mise_en_relation'
  | 'parrainage_converti'

interface FunnelParams {
  talentId?: string | null
  userId?: string | null
  jobId?: string | null
  companyId?: string | null
}

// Fire-and-forget — ne bloque jamais l'action principale.
export function logFunnel(type: FunnelEventType, params: FunnelParams = {}): void {
  const supabase = createAdminClient()
  supabase.from('funnel_events').insert({
    event_type:  type,
    talent_id:   params.talentId  ?? null,
    user_id:     params.userId    ?? null,
    job_id:      params.jobId     ?? null,
    company_id:  params.companyId ?? null,
  }).then(({ error }) => {
    if (error) console.error('[funnel]', type, error.message)
  })
}
