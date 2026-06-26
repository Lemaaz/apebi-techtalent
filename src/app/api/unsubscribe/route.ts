import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://techtalent-apebi.vercel.app'

function verifyToken(profileId: string, token: string): boolean {
  const secret = process.env.CRON_SECRET ?? 'fallback'
  const expected = createHmac('sha256', secret).update(profileId).digest('hex').slice(0, 32)
  return expected === token
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const id    = searchParams.get('id')
  const token = searchParams.get('token')

  if (!id || !token || !verifyToken(id, token)) {
    return NextResponse.redirect(`${APP_URL}/unsubscribe?error=invalid`)
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('talent_profiles')
    .update({ receive_alerts: false })
    .eq('id', id)

  if (error) {
    console.error('[unsubscribe]', error.message)
    return NextResponse.redirect(`${APP_URL}/unsubscribe?error=server`)
  }

  return NextResponse.redirect(`${APP_URL}/unsubscribe?success=1`)
}
