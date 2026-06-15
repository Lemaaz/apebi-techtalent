// src/app/(auth)/mot-de-passe-oublie/page.tsx
import type { Metadata } from 'next'
import { ResetPasswordForm } from './_form'

export const metadata: Metadata = {
  title: 'Mot de passe oublié | APEBI TechTalent',
}

export default function MotDePasseOubliePage() {
  return <ResetPasswordForm />
}
