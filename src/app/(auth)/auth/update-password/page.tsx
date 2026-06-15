// src/app/(auth)/auth/update-password/page.tsx
import type { Metadata } from 'next'
import { UpdatePasswordForm } from './_form'

export const metadata: Metadata = {
  title: 'Nouveau mot de passe | APEBI TechTalent',
}

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />
}
