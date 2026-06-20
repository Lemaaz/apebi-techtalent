// src/app/talent/profil/modifier/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { EditProfileForm } from './_form'

type DomainWithSkills = {
  id: string
  name_fr: string
  color: string | null
  skills: { id: string; name: string }[]
}

export default async function ModifierProfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select(
      `id, avatar_url, first_name, last_name, title, bio, city, years_experience, seniority_level,
       availability, remote_preference, expected_salary_range, job_type,
       linkedin_url, github_url, portfolio_url,
       talent_skills ( skill_id ),
       experiences ( id, company_name, title, description, start_date, end_date, is_current, location ),
       educations ( id, institution, degree, field, start_year, end_year )`,
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (!talent) redirect('/talent/inscription')

  const { data: domains } = await supabase
    .from('domains')
    .select('id, name_fr, color, skills(id, name)')
    .order('name_fr')
    .returns<DomainWithSkills[]>()

  const currentSkillIds = new Set(
    (talent.talent_skills ?? []).map((ts: { skill_id: string }) => ts.skill_id),
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/talent/profil"
            className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Retour au profil
          </Link>
          <h1 className="mb-8 font-heading text-xl font-bold text-foreground">
            Modifier mon profil
          </h1>
          <EditProfileForm
            talent={talent}
            domains={domains ?? []}
            currentSkillIds={currentSkillIds}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
