import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TalentInscriptionForm } from './_form'

type DomainWithSkills = {
  id: string
  name_fr: string
  color: string | null
  skills: { id: string; name: string }[]
}

export default async function TalentInscriptionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Check if profile already exists
  const { data: existing } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) redirect('/talent/profil')

  // Load domains + skills for step 2
  const { data: domains } = await supabase
    .from('domains')
    .select('id, name_fr, color, skills(id, name)')
    .order('name_fr')
    .returns<DomainWithSkills[]>()

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8">
        <h1 className="font-heading text-xl font-bold text-foreground">
          Créez votre profil talent
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Renseignez votre profil pour être visible auprès des entreprises membres APEBI.
        </p>
      </div>
      <TalentInscriptionForm domains={domains ?? []} />
    </div>
  )
}
