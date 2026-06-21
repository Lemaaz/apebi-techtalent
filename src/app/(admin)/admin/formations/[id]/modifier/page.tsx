import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ModifierFormationForm } from './_form'

export const metadata: Metadata = { title: 'Modifier la formation — Admin' }

export default async function ModifierFormationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: program }, { data: institutions }, { data: domains }] = await Promise.all([
    supabase
      .from('training_programs')
      .select('id, title, description, institution_id, domain_id, level, modality, duration_text, price_range, url_inscription, is_featured, status')
      .eq('id', id)
      .single(),
    supabase.from('training_institutions').select('id, name').eq('status', 'active').order('name'),
    supabase.from('domains').select('id, name_fr').order('name_fr'),
  ])

  if (!program) notFound()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/formations"
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Retour aux formations
        </Link>
      </div>
      <h1 className="font-heading text-xl font-bold text-foreground mb-6">Modifier la formation</h1>
      <ModifierFormationForm
        program={program}
        institutions={institutions ?? []}
        domains={domains ?? []}
      />
    </div>
  )
}
