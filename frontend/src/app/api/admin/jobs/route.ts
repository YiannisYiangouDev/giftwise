import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // 1. Verify authenticated admin session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminRow } = await supabase.from('admins').select('user_id').eq('user_id', user.id).single()
  const envAdmins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  if (!adminRow && !envAdmins.includes(user.email?.toLowerCase() || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Validate environment vars
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Supabase URL or Service Role key is not configured' }, { status: 500 })
  }

  // 3. Parse request body
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { job } = body as { job?: string }
  if (job !== 'price-checker' && job !== 'birthday-reminder') {
    return NextResponse.json({ error: 'Invalid job type. Must be "price-checker" or "birthday-reminder"' }, { status: 400 })
  }

  // 4. Trigger Edge Function
  try {
    const response = await fetch(`${url}/functions/v1/${job}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ error: `Edge function failed: ${errText || response.statusText}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, result: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Network error triggering edge function' }, { status: 500 })
  }
}
