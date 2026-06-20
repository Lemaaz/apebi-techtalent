import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CompanySidebarNav } from '@/components/company/company-sidebar-nav'
import { DashboardNavbar } from '@/components/layout/dashboard-navbar'
import { Footer } from '@/components/layout/footer'

export default async function EntrepriseLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Fetch company for sidebar info
  const { data: member } = await supabase
    .from('company_members')
    .select('full_name, role_in_company, company_profiles(name, logo_url, validation_status)')
    .eq('user_id', user.id)
    .maybeSingle()

  const company = member
    ? (member.company_profiles as { name: string; logo_url: string | null; validation_status: string } | null)
    : null

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
          <CompanySidebarNav />

          {/* Company info pill */}
          {company && (
            <div
              className="mt-8 rounded-lg p-3"
              style={{ background: 'var(--apebi-bg-alt)', border: '1px solid var(--apebi-border)' }}
            >
              <p className="truncate font-heading text-[12px] font-semibold text-foreground">
                {company.name}
              </p>
              {member?.role_in_company && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">{member.role_in_company}</p>
              )}
              {company.validation_status === 'pending' && (
                <span
                  className="mt-2 inline-block rounded-full px-2 py-0.5 font-heading text-[10px] font-semibold"
                  style={{ background: 'var(--color-warning-muted)', color: 'var(--color-warning-text)' }}
                >
                  En attente de validation
                </span>
              )}
            </div>
          )}

          {!company && (
            <div
              className="mt-8 rounded-lg p-3"
              style={{ background: 'var(--color-warning-muted)', border: '1px solid var(--color-warning)' }}
            >
              <p className="text-[11px] font-semibold" style={{ color: 'var(--color-warning-text)' }}>
                Compte non associé
              </p>
              <p className="mt-0.5 text-[10px]" style={{ color: 'var(--color-warning-text)' }}>
                Contactez l'équipe APEBI
              </p>
            </div>
          )}

          {/* Back to site */}
          <div className="mt-6">
            <Link
              href="/offres"
              className="flex items-center gap-1.5 font-heading text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Site public
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
