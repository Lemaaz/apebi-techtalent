import type { Metadata } from 'next'
import { InscriptionForm } from './_form'

export const metadata: Metadata = {
  title: 'Inscription | APEBI TechTalent',
}

export default function InscriptionPage() {
  return <InscriptionForm />
}
