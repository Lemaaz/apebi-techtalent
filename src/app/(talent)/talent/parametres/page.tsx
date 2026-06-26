import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ParametresClient } from './_client'

export const metadata: Metadata = { title: 'Paramètres | APEBI TechTalent' }

export default async function ParametresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('visibility, receive_alerts')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!talent) redirect('/talent/inscription')

  return (
    <>
      <div>
        <div
          className="border-b px-4 py-6 sm:px-6"
          style={{ background: 'var(--apebi-bg-alt)', borderColor: 'var(--apebi-border)' }}
        >
          <div className="mx-auto max-w-2xl">
            <p className="text-overline mb-1">Mon espace talent</p>
            <h1 className="font-heading text-xl font-semibold text-foreground">Paramètres du compte</h1>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <ParametresClient
            email={user.email ?? ''}
            visibility={talent.visibility ?? false}
            receiveAlerts={talent.receive_alerts ?? true}
          />
        </div>
      </div>
    </>
  )
}
