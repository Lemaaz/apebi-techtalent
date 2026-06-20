import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { TalentCard, type TalentCardData } from '@/components/talent/talent-card'
import { BookmarkTalentButton } from '@/components/company/bookmark-talent-button'

export const metadata: Metadata = { title: 'Talents favoris | APEBI TechTalent' }

export default async function FavorisTalentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: member } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) redirect('/entreprise/dashboard')

  const { data: saved = [] } = await supabase
    .from('saved_talents')
    .select(`
      talent_id,
      talent_profiles (
        id, first_name, last_name, title, city, avatar_url,
        availability, seniority_level,
        talent_skills ( skills ( name ) )
      )
    `)
    .eq('company_id', member.company_id)
    .order('saved_at', { ascending: false })

  type SavedRow = {
    talent_id: string
    talent_profiles: {
      id: string
      first_name: string
      last_name: string
      title: string | null
      city: string | null
      avatar_url: string | null
      availability: string | null
      seniority_level: string | null
      talent_skills: Array<{ skills: { name: string } | null }>
    } | null
  }

  const talents: TalentCardData[] = (saved as SavedRow[])
    .filter((s) => s.talent_profiles !== null)
    .map((s) => {
      const t = s.talent_profiles!
      return {
        id: t.id,
        first_name: t.first_name,
        last_name: t.last_name,
        title: t.title,
        city: t.city,
        avatar_url: t.avatar_url,
        availability: t.availability,
        seniority_level: t.seniority_level,
        skills: (t.talent_skills ?? []).map((ts) => ts.skills?.name).filter(Boolean) as string[],
      }
    })

  const savedIds = new Set((saved as SavedRow[]).map((s) => s.talent_id))

  return (
      <>
        <div
          className="border-b px-4 py-6 sm:px-6"
          style={{ background: 'var(--apebi-bg-alt)', borderColor: 'var(--apebi-border)' }}
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-overline mb-1">Espace recruteur</p>
                <h1 className="font-heading text-xl font-semibold text-foreground">
                  Talents favoris
                </h1>
              </div>
              <Link
                href="/entreprise/recherche-talents"
                className="font-heading text-[12px] font-medium text-muted-foreground hover:text-foreground"
              >
                ← Recherche
              </Link>
            </div>
            <p className="mt-2 font-sans text-[12px] text-muted-foreground">
              <span className="font-semibold text-foreground">{talents.length}</span>{' '}
              profil{talents.length !== 1 ? 's' : ''} sauvegardé{talents.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {talents.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="Aucun talent sauvegardé"
              description="Utilisez l'icône favoris dans la recherche pour retrouver rapidement vos profils préférés."
              action={{ label: 'Rechercher des talents', href: '/entreprise/recherche-talents' }}
            />
          ) : (
            <ul
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              role="list"
              aria-label={`${talents.length} talents favoris`}
            >
              {talents.map((talent) => (
                <li key={talent.id} className="relative">
                  <TalentCard {...talent} />
                  <div className="absolute right-2 top-2">
                    <BookmarkTalentButton
                      talentId={talent.id}
                      isSaved={savedIds.has(talent.id)}
                      size="sm"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </>

  )
}
