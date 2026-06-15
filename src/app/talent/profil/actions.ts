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
