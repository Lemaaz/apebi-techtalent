import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { JobPostingForm, type SkillGroup } from './_form'

export const metadata: Metadata = {
  title: 'Nouvelle offre | APEBI TechTalent',
}

type SkillRow = {
  id: string
  name: string
  domains: { name: string } | null
}

export default async function NouvelleOffrePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: member } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) redirect('/entreprises/inscription')

  const { data: skills = [] } = await supabase
    .from('skills')
    .select('id, name, domains ( name )')
    .order('name')
    .returns<SkillRow[]>()

  const grouped = (skills ?? []).reduce<Record<string, SkillGroup>>((acc, skill) => {
    const domain = skill.domains?.name ?? 'Autres'
    if (!acc[domain]) {
      acc[domain] = { domain, skills: [] }
    }
    acc[domain].skills.push({ id: skill.id, name: skill.name })
    return acc
  }, {})

  const skillGroups = Object.values(grouped).sort((a, b) =>
    a.domain.localeCompare(b.domain, 'fr'),
  )

  return (
      <div className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/entreprise/offres"
            className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Mes offres
          </Link>

          <h1 className="mb-6 font-heading text-xl font-bold text-foreground">
            Nouvelle offre d&apos;emploi
          </h1>

          <div className="rounded-2xl border border-border bg-card p-6">
            <JobPostingForm skillGroups={skillGroups} />
          </div>
        </div>
      </div>
  )
}
