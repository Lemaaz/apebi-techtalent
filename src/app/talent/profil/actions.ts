'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function toggleVisibility(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const current = formData.get('current') === 'true'

  await supabase
    .from('talent_profiles')
    .update({ visibility: !current })
    .eq('user_id', user.id)

  revalidatePath('/talent/profil')
}

// ── TAL-11 : Mise à jour avatar ──────────────────────────────

export async function updateAvatarUrl(url: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Validate URL is from our Supabase storage (prevents arbitrary URL injection)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!url.startsWith(`${supabaseUrl}/storage`)) {
    throw new Error('URL de stockage invalide')
  }

  await supabase
    .from('talent_profiles')
    .update({ avatar_url: url })
    .eq('user_id', user.id)

  revalidatePath('/talent/profil')
}

// ── TAL-12 : Mise à jour CV PDF ──────────────────────────────

export async function updateCvUrl(url: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!url.startsWith(`${supabaseUrl}/storage`)) {
    throw new Error('URL de stockage invalide')
  }

  await supabase
    .from('talent_profiles')
    .update({ cv_url: url })
    .eq('user_id', user.id)

  revalidatePath('/talent/profil')
}

// ── Growth B : Profil public partageable (opt-in) ────────────

export async function togglePublicProfile(current: boolean): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  if (!current) {
    // Activation : générer un token s'il n'en existe pas déjà
    const { data: profile } = await supabase
      .from('talent_profiles')
      .select('public_token')
      .eq('user_id', user.id)
      .maybeSingle<{ public_token: string | null }>()

    const token = profile?.public_token ?? randomUUID()
    await supabase
      .from('talent_profiles')
      .update({ public_enabled: true, public_token: token })
      .eq('user_id', user.id)
  } else {
    // Désactivation : le lien devient inactif (token conservé pour réactivation)
    await supabase
      .from('talent_profiles')
      .update({ public_enabled: false })
      .eq('user_id', user.id)
  }

  revalidatePath('/talent/profil')
}

// Régénère le token public (invalide l'ancien lien partagé)
export async function regeneratePublicToken(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  await supabase
    .from('talent_profiles')
    .update({ public_token: randomUUID() })
    .eq('user_id', user.id)

  revalidatePath('/talent/profil')
}
