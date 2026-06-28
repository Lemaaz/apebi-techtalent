import type { Metadata } from 'next'
import { ConnexionForm } from './_form'

export const metadata: Metadata = {
  title: 'Connexion',
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; message?: string; error?: string }>
}) {
  const { redirect, message, error } = await searchParams
  return (
    <ConnexionForm
      redirectTo={redirect ?? null}
      message={message ?? null}
      initialError={error ?? null}
    />
  )
}
