'use server'

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
