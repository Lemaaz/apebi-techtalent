import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
// Allowlist explicite — empêche l'écriture dans des buckets arbitraires
const ALLOWED_BUCKETS = ['avatars', 'logos'] as const
type AllowedBucket = (typeof ALLOWED_BUCKETS)[number]

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Parse multipart form data
  const form = await req.formData()
  const file = form.get('file') as File | null
  const bucketParam = (form.get('bucket') as string | null) ?? 'avatars'

  if (!ALLOWED_BUCKETS.includes(bucketParam as AllowedBucket)) {
    return NextResponse.json({ error: 'Bucket non autorisé' }, { status: 400 })
  }
  const bucket = bucketParam as AllowedBucket

  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Format non supporté (JPEG, PNG ou WebP)' }, { status: 400 })
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 2 Mo)' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    })

  if (error) {
    console.error('[upload] Supabase storage error:', error.message)
    return NextResponse.json({ error: 'Erreur upload' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
