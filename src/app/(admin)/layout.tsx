import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Shield, ShieldCheck, ArrowLeft } from 'lucide-react'
import { AdminSidebarNav } from '@/components/admin/admin-sidebar-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  const isSuperAdmin = user.user_metadata?.role === 'SUPER_ADMIN'

  return (
    <div className="flex min-h-dvh flex-col" style={{ background: 'var(--apebi-bg-admin)' }}>

      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: '#212121', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">

          {/* Logo + badge Admin */}
          <div className="flex items-center gap-3">
            <div className="rounded bg-white px-2 py-0.5">
              <Image
                src="/apebi-logo.png"
                alt="APEBI"
                width={72}
                height={20}
                className="h-5 w-auto object-contain"
                priority
              />
            </div>
            <span className="font-heading text-sm font-semibold text-white">
              <span style={{ color: 'var(--apebi-cyan)' }}>Tech</span>Talent
            </span>
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{ background: isSuperAdmin ? 'rgba(139,92,246,0.15)' : 'var(--apebi-cyan-muted)', border: isSuperAdmin ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(0,175,210,0.3)' }}
            >
              {isSuperAdmin
                ? <ShieldCheck className="size-3" style={{ color: '#8B5CF6' }} aria-hidden />
                : <Shield className="size-3" style={{ color: 'var(--apebi-cyan)' }} aria-hidden />
              }
              <span
                className="font-heading text-[11px] font-semibold"
                style={{ color: isSuperAdmin ? '#8B5CF6' : 'var(--apebi-cyan)' }}
              >
                {isSuperAdmin ? 'Super Admin' : 'Admin APEBI'}
              </span>
            </div>
          </div>

          {/* Back to site */}
          <Link
            href="/"
            className="flex items-center gap-1.5 font-heading text-[12px] font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'white' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.5)' }}
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Site public
          </Link>
        </div>
      </header>

      {/* ── Body : sidebar + content ── */}
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 px-4 sm:px-6">

        {/* Sidebar */}
        <aside
          className="w-52 shrink-0 border-r py-8 pr-4"
          style={{ borderColor: 'var(--apebi-border)', background: 'var(--apebi-bg-admin)' }}
        >
          <AdminSidebarNav superAdmin={isSuperAdmin} />

          {/* Admin info pill */}
          <div
            className="mt-8 rounded-lg p-3"
            style={{ background: 'var(--apebi-bg-alt)', border: '1px solid var(--apebi-border)' }}
          >
            <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Formation & Tech Talents
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              APEBI TechTalent · Back-office
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 py-8 pl-8">
          {children}
        </main>
      </div>
    </div>
  )
}
