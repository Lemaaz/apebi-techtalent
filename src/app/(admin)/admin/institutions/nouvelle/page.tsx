import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NouvelleInstitutionForm } from './_form'

export const metadata: Metadata = { title: 'Nouvelle institution — Admin' }

export default function NouvelleInstitutionPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/institutions"
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Institutions
        </Link>
        <h1 className="font-heading text-xl font-bold">Ajouter une institution</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <NouvelleInstitutionForm />
      </div>
    </div>
  )
}
