import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NouvelleFormationForm } from './_form'

export const metadata: Metadata = { title: 'Nouvelle formation — Admin' }

export default async function NouvelleFormationPage() {
  const supabase = await createClient()

  const [{ data: institutions = [] }, { data: domains = [] }] = await Promise.all([
    supabase.from('training_institutions').select('id, name').eq('status', 'active').order('name'),
    supabase.from('domains').select('id, name_fr').order('name_fr'),
  ])

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/formations"
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Formations
        </Link>
        <h1 className="font-heading text-xl font-bold">Ajouter une formation</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <NouvelleFormationForm
          institutions={institutions ?? []}
          domains={domains ?? []}
        />
      </div>
    </div>
  )
}
