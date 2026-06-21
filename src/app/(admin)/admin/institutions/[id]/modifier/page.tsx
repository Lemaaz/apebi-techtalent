import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ModifierInstitutionForm } from './_form'

export const metadata: Metadata = { title: 'Modifier l\'institution — Admin' }

export default async function ModifierInstitutionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: institution } = await supabase
    .from('training_institutions')
    .select('id, name, type, description, website_url, city, is_apebi_partner, status')
    .eq('id', id)
    .single()

  if (!institution) notFound()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/institutions"
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Retour aux institutions
        </Link>
      </div>
      <h1 className="font-heading text-xl font-bold text-foreground mb-6">Modifier l&apos;institution</h1>
      <ModifierInstitutionForm institution={institution} />
    </div>
  )
}
