import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Allowlist explicite — empêche l'écriture dans des buckets arbitraires
const ALLOWED_BUCKETS = ['avatars', 'logos', 'resumes'] as const
type AllowedBucket = (typeof ALLOWED_BUCKETS)[number]

const BUCKET_CONFIG: Record<AllowedBucket, { types: string[]; maxBytes: number }> = {
  avatars: { types: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 2 * 1024 * 1024 },
  logos:   { types: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 2 * 1024 * 1024 },
  resumes: { types: ['application/pdf'],                        maxBytes: 5 * 1024 * 1024 },
}

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
  const config = BUCKET_CONFIG[bucket]

  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  if (!config.types.includes(file.type)) {
    const accepted = bucket === 'resumes' ? 'PDF uniquement' : 'JPEG, PNG ou WebP'
    return NextResponse.json({ error: `Format non supporté (${accepted})` }, { status: 400 })
  }
  if (file.size > config.maxBytes) {
    const max = config.maxBytes / (1024 * 1024)
    return NextResponse.json({ error: `Fichier trop volumineux (max ${max} Mo)` }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? (bucket === 'resumes' ? 'pdf' : 'jpg')
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
