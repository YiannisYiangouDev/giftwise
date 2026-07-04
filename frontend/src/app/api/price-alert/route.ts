import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request) {
  const body = await req.json() as {
    itemId: string
    alert_enabled?: boolean
    target_price?: number
  }

  const { itemId, alert_enabled, target_price } = body

  if (!itemId) {
    return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const update: Record<string, unknown> = {}

  if (typeof alert_enabled === 'boolean') {
    update.alert_enabled = alert_enabled
    // Re-arm: new toggle means the user wants a fresh alert
    if (alert_enabled) update.alert_sent = false
  }

  if (typeof target_price === 'number') {
    update.target_price = target_price
    // New target price always re-arms the alert
    update.alert_sent = false
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('wishlist_items')
    .update(update)
    .eq('id', itemId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
