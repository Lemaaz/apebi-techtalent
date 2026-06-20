import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { headers } from 'next/headers'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TalentSidebarNav } from '@/components/talent/talent-sidebar-nav'
import { DashboardNavbar } from '@/components/layout/dashboard-navbar'
import { Footer } from '@/components/layout/footer'

export default async function TalentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Skip sidebar for the inscription (profile creation) flow
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  if (pathname === '/talent/inscription') {
    return (
      <div className="flex min-h-dvh flex-col">
        <DashboardNavbar />
        <main className="flex flex-1 items-start justify-center px-4 py-12">
          {children}
        </main>
        <Footer />
      </div>
    )
  }

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('first_name, last_name, completeness_score, validation_status')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="flex min-h-dvh flex-col">
      <DashboardNavbar />

      {/* ── Body : sidebar + content ── */}
      <div className="mx-auto flex w-full max-w-[1300px] flex-1 gap-0 px-4 sm:px-6">

        {/* Sidebar */}
        <aside
          className="hidden w-52 shrink-0 border-r py-8 pr-4 md:block"
          style={{ borderColor: 'var(--apebi-border)' }}
        >
          <TalentSidebarNav />

          {/* Profile completeness pill */}
          {talent && (
            <div
              className="mt-8 rounded-lg p-3"
              style={{ background: 'var(--apebi-bg-alt)', border: '1px solid var(--apebi-border)' }}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Complétude profil
                </p>
                <span
                  className="font-heading text-[11px] font-bold"
                  style={{ color: 'var(--apebi-cyan)' }}
                >
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
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${talent.completeness_score ?? 0}%`,
                    background: 'var(--apebi-cyan)',
                  }}
                />
              </div>
              {(talent.completeness_score ?? 0) < 70 && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Atteignez 70% pour être visible des recruteurs
                </p>
              )}
            </div>
          )}

          {/* Back to site */}
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

        {/* Main content */}
        <main className="min-w-0 flex-1 py-8 md:pl-8">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  )
}
