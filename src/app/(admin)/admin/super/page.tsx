import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ShieldCheck, Users, Key, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminKpiCard } from '@/components/admin/admin-kpi-card'
import { PromoteAdminForm } from './_form'

export const metadata: Metadata = { title: 'Super Admin | APEBI TechTalent' }

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const isSuperAdmin = user.user_metadata?.role === 'SUPER_ADMIN'
  if (!isSuperAdmin) redirect('/admin')

  // Fetch admin users list (users with role=ADMIN in metadata)
  const { data: allUsers, error } = await supabase
    .from('talent_profiles')
    .select('user_id, display_name, avatar_url')
    .limit(5)

  // Count all users via auth (approximate from profiles)
  const [
    { count: totalTalents },
    { count: totalCompanies },
  ] = await Promise.all([
    supabase.from('talent_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('company_profiles').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-xl"
          style={{ background: 'rgba(139,92,246,0.15)' }}
        >
          <ShieldCheck className="size-5" style={{ color: '#8B5CF6' }} aria-hidden />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Super Admin</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Accès privilégié — gestion de la plateforme au niveau racine
          </p>
        </div>
      </div>

      {/* Warning banner */}
      <div
        className="mb-8 flex items-start gap-3 rounded-xl p-4"
        style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-500" aria-hidden />
        <p className="text-[13px] text-rose-700 dark:text-rose-400">
          Les actions effectuées ici sont irréversibles et affectent l'ensemble de la plateforme.
          Procédez avec précaution.
        </p>
      </div>

      {/* KPI stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminKpiCard
          label="Talents inscrits"
          value={totalTalents ?? 0}
          icon={Users}
          sublabel="Total profils talents"
        />
        <AdminKpiCard
          label="Entreprises membres"
          value={totalCompanies ?? 0}
          icon={Users}
          sublabel="Entreprises APEBI actives"
        />
      </div>

      {/* Promote admin section */}
      <div
        className="mb-6 rounded-2xl p-6"
        style={{ background: 'white', border: '1px solid var(--apebi-border)' }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Key className="size-4" style={{ color: '#8B5CF6' }} aria-hidden />
          <h2 className="font-heading text-base font-semibold text-foreground">
            Promouvoir un utilisateur Admin
          </h2>
        </div>
        <p className="mb-4 text-[13px] text-muted-foreground">
          Entrez l&apos;email d&apos;un utilisateur existant pour lui accorder le rôle Admin APEBI.
          L&apos;utilisateur devra se reconnecter pour que les changements prennent effet.
        </p>
        <PromoteAdminForm />
      </div>

      {/* Platform identity section */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'white', border: '1px solid var(--apebi-border)' }}
      >
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="size-4" style={{ color: '#8B5CF6' }} aria-hidden />
          <h2 className="font-heading text-base font-semibold text-foreground">
            Identité Super Admin
          </h2>
        </div>
        <div className="space-y-2 text-[13px] text-muted-foreground">
          <p><span className="font-medium text-foreground">Email :</span> {user.email}</p>
          <p><span className="font-medium text-foreground">User ID :</span> <code className="rounded bg-muted px-1 py-0.5 text-[11px]">{user.id}</code></p>
          <p><span className="font-medium text-foreground">Rôle :</span> <span className="font-semibold" style={{ color: '#8B5CF6' }}>SUPER_ADMIN</span></p>
        </div>
      </div>
    </div>
  )
}
