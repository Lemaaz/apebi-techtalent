import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EntrepriseParametresClient } from './_client'

export const metadata: Metadata = { title: 'Paramètres' }

export default async function EntrepriseParametresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: member } = await supabase
    .from('company_members')
    .select('notify_on_application')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) redirect('/entreprise/dashboard')

  return (
    <>
      <div
        className="border-b px-4 py-6 sm:px-6"
        style={{ background: 'var(--apebi-bg-alt)', borderColor: 'var(--apebi-border)' }}
      >
        <div className="mx-auto max-w-2xl">
          <p className="text-overline mb-1">Mon espace recruteur</p>
          <h1 className="font-heading text-xl font-semibold text-foreground">Paramètres du compte</h1>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <EntrepriseParametresClient
          email={user.email ?? ''}
          notifyOnApplication={member.notify_on_application ?? true}
        />
      </div>
    </>
  )
}
