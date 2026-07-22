import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function tryGetAdminClient() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return null
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
    return createSupabaseClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  } catch {
    return null
  }
}

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: adminRow } = await supabase.from('admins').select('user_id').eq('user_id', user.id).single()
  const envAdmins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  return !!adminRow || envAdmins.includes(user.email?.toLowerCase() || '')
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, base_url, country, scraper_type, scraper_config } = body as {
    name?: string
    base_url?: string
    country?: string
    scraper_type?: string
    scraper_config?: string
  }

  if (!name || !base_url || !scraper_type) {
    return NextResponse.json({ error: 'Missing required fields: name, base_url, scraper_type' }, { status: 400 })
  }

  const adminClient = tryGetAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  }

  let configObj = null
  if (scraper_config) {
    try {
      configObj = typeof scraper_config === 'string' ? JSON.parse(scraper_config) : scraper_config
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in scraper_config' }, { status: 400 })
    }
  }

  const { data, error } = await adminClient
    .from('tracked_stores')
    .insert({
      name,
      base_url,
      country: country || 'CY',
      scraper_type,
      scraper_config: configObj || {},
      is_active: true
    })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, store: data?.[0] })
}

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, is_active } = body as { id?: string; is_active?: boolean }

  if (!id || typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'Missing required fields: id, is_active' }, { status: 400 })
  }

  const adminClient = tryGetAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  }

  const { data, error } = await adminClient
    .from('tracked_stores')
    .update({ is_active })
    .eq('id', id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, store: data?.[0] })
}
