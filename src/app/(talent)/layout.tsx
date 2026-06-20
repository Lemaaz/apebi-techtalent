/**
 * Layout for talent pages in the (talent) route group.
 * Renders the same sidebar shell as src/app/talent/layout.tsx —
 * kept separate because Next.js file-system routing treats
 * src/app/talent/ and src/app/(talent)/talent/ as distinct hierarchies.
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  UserCircle,
  Briefcase,
  Bookmark,
  Settings,
  ArrowLeft,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TalentSidebarNav } from '@/components/talent/talent-sidebar-nav'
import { DashboardNavbar } from '@/components/layout/dashboard-navbar'
import { Footer } from '@/components/layout/footer'

const NAV = [
  { href: '/talent/dashboard',           label: 'Dashboard',           icon: LayoutDashboard, exact: true },
  { href: '/talent/profil',              label: 'Mon Profil',          icon: UserCircle },
  { href: '/talent/candidatures',        label: 'Mes Candidatures',    icon: Briefcase },
  { href: '/talent/offres-sauvegardees', label: 'Offres Sauvegardées', icon: Bookmark },
  { href: '/talent/parametres',          label: 'Paramètres',          icon: Settings },
]

export default async function TalentGroupLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('completeness_score')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="flex min-h-dvh flex-col">
      <DashboardNavbar />

      <div className="mx-auto flex w-full max-w-[1300px] flex-1 gap-0 px-4 sm:px-6">
        <aside
          className="hidden w-52 shrink-0 border-r py-8 pr-4 md:block"
          style={{ borderColor: 'var(--apebi-border)' }}
        >
          <TalentSidebarNav />

          {talent && (
            <div
              className="mt-8 rounded-lg p-3"
              style={{ background: 'var(--apebi-bg-alt)', border: '1px solid var(--apebi-border)' }}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Complétude profil
                </p>
                <span className="font-heading text-[11px] font-bold" style={{ color: 'var(--apebi-cyan)' }}>
                  {talent.completeness_score ?? 0}%
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full"
                style={{ background: 'var(--apebi-border)' }}
                role="progressbar"
                aria-valuenow={talent.completeness_score ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${talent.completeness_score ?? 0}%`, background: 'var(--apebi-cyan)' }}
                />
              </div>
            </div>
          )}

          <div className="mt-6">
            <Link
              href="/offres"
              className="flex items-center gap-1.5 font-heading text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Retour aux offres
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 py-8 md:pl-8">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  )
}
