import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── ADM-07 : Export CSV — talents ou offres ──────────────────
// Accès : admin uniquement (vérifié via RPC is_admin)

const ALLOWED_TYPES = ['talents', 'offres'] as const
type ExportType = (typeof ALLOWED_TYPES)[number]

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown): string => {
    const s = v == null ? '' : String(v)
    // Wrap in quotes if contains comma, newline or quote
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ]
  return lines.join('\r\n')
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const isAdmin = (await supabase.rpc('is_admin')).data === true
  if (!isAdmin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const typeParam = req.nextUrl.searchParams.get('type') ?? ''
  if (!ALLOWED_TYPES.includes(typeParam as ExportType)) {
    return NextResponse.json({ error: 'type invalide (talents|offres)' }, { status: 400 })
  }

  const type = typeParam as ExportType

  if (type === 'talents') {
    const { data, error } = await supabase
      .from('talent_profiles')
      .select(
        'id, first_name, last_name, title, city, seniority_level, years_experience,' +
        'availability, remote_preference, validation_status, visibility, completeness_score,' +
        'linkedin_url, github_url, created_at',
      )
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const csv = toCSV((data ?? []) as unknown as Record<string, unknown>[])
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="talents-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  // type === 'offres'
  const { data, error } = await supabase
    .from('job_postings')
    .select(
      'id, title, slug, contract_type, seniority_level, city, remote_policy,' +
      'status, applications_count, views_count, closes_at, created_at, published_at,' +
      'company_profiles(name)',
    )
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten company name
  type JobRow = { company_profiles: { name: string } | null } & Record<string, unknown>
  const rows = ((data ?? []) as unknown as JobRow[]).map(
    ({ company_profiles, ...rest }) => ({
      ...rest,
      company_name: company_profiles?.name ?? '',
    }),
  )

  const csv = toCSV(rows)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="offres-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
