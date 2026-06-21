'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function promoteToAdmin(formData: FormData): Promise<{ error?: string; success?: string }> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return { error: 'Email invalide.' }
  }

  const supabase = await createAdminClient()

  // Find user by email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) return { error: 'Erreur lors de la recherche de l\'utilisateur.' }

  const target = users.find((u) => u.email?.toLowerCase() === email)
  if (!target) return { error: 'Aucun utilisateur trouvé avec cet email.' }

  // Check not already SUPER_ADMIN
  if (target.user_metadata?.role === 'SUPER_ADMIN' || (target as any).app_metadata?.role === 'SUPER_ADMIN') {
    return { error: 'Cet utilisateur est déjà Super Admin.' }
  }

  // Promote to ADMIN
  const { error: updateError } = await supabase.auth.admin.updateUserById(target.id, {
    user_metadata: { ...target.user_metadata, role: 'ADMIN' },
    app_metadata: { ...(target.app_metadata ?? {}), role: 'ADMIN' },
  })

  if (updateError) return { error: 'Erreur lors de la promotion : ' + updateError.message }

  revalidatePath('/admin/super')
  return { success: `${email} a été promu Admin APEBI avec succès.` }
}

export async function createCompanyDirect(
  _prev: { error?: string; success?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  // Verify caller is SUPER_ADMIN
  const anonClient = await createClient()
  const { data: { user: caller } } = await anonClient.auth.getUser()
  const callerAppRole = (caller as any)?.app_metadata?.role as string | undefined
  if (!caller || callerAppRole !== 'SUPER_ADMIN') {
    return { error: 'Accès refusé — Super Admin uniquement.' }
  }

  const supabase = await createAdminClient()
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)
  const role = (formData.get('role_in_company') as string)?.trim() || 'Administrateur'

  if (!name || !email || !password) return { error: 'Tous les champs sont requis.' }

  // 1. Créer le compte auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'entreprise' },
  })
  if (authError) return { error: 'Erreur création compte : ' + authError.message }

  const userId = authData.user.id

  // 2. Générer un slug unique
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const { data: existing } = await supabase
    .from('company_profiles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) {
    slug = slug + '-' + Math.random().toString(36).slice(2, 6)
  }

  // 3. Créer le profil entreprise
  const { data: company, error: companyError } = await supabase
    .from('company_profiles')
    .insert({ name, slug, country: 'Maroc', validation_status: 'approved' })
    .select('id')
    .single()
  if (companyError) {
    // Supprimer l'utilisateur auth créé si le profil échoue
    await supabase.auth.admin.deleteUser(userId)
    return { error: 'Erreur création profil : ' + companyError.message }
  }

  // 4. Lier l'utilisateur à l'entreprise
  const { error: memberError } = await supabase
    .from('company_members')
    .insert({ user_id: userId, company_id: company.id, full_name: name, role_in_company: role })
  if (memberError) {
    await supabase.auth.admin.deleteUser(userId)
    await supabase.from('company_profiles').delete().eq('id', company.id)
    return { error: 'Erreur liaison membre : ' + memberError.message }
  }

  revalidatePath('/admin/super')
  revalidatePath('/admin/entreprises')
  return { success: `Entreprise "${name}" créée et validée. Compte recruteur : ${email}` }
}
