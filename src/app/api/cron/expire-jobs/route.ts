import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Authorization check — must be first
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET environment variable is not set' },
      { status: 500 }
    )
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    // Update all active jobs with closes_at in the past to closed status
    const { data, error } = await supabase
      .from('job_postings')
      .update({ status: 'closed' })
      .eq('status', 'active')
      .lt('closes_at', now)
      .select('id')

    if (error) {
      console.error('Error expiring jobs:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const expiredCount = data?.length || 0
    console.log(`Cron: Expired ${expiredCount} job postings`)

    return NextResponse.json({
      ok: true,
      message: `Successfully expired ${expiredCount} job posting(s)`,
      count: expiredCount
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
