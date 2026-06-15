import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CompanyRegistrationForm } from './_form'

export const metadata: Metadata = {
  title: 'Inscrire mon entreprise | APEBI TechTalent',
  description:
    'Inscrivez votre entreprise membre APEBI sur TechTalent pour accéder aux profils talents et publier vos offres.',
}

export default async function EntrepriseInscriptionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion?next=/entreprises/inscription')

  // Check if already linked to a company
  const { data: existing } = await supabase
    .from('company_members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) redirect('/entreprise/dashboard')

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex flex-1 items-start justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="size-6 text-primary" aria-hidden />
            </div>
            <h1 className="font-heading text-xl font-bold text-foreground">
              Inscrire mon entreprise
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Réservé aux membres APEBI. Votre inscription sera validée par l&apos;équipe C5.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <CompanyRegistrationForm />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Pas encore membre APEBI ?{' '}
            <a
              href="https://apebi.ma"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Rejoignez la fédération
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
