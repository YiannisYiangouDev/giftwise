import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all user data
  const [recipients, wishlists, items, notifications] = await Promise.all([
    supabase.from('recipients').select('*').eq('user_id', user.id),
    supabase.from('wishlists').select('*, recipients!inner(user_id)').eq('recipients.user_id', user.id),
    supabase.from('wishlist_items').select('*, wishlists!inner(recipients!inner(user_id))').eq('wishlists.recipients.user_id', user.id),
    supabase.from('notifications').select('*').eq('user_id', user.id),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    account: {
      email: user.email,
      id: user.id,
      created_at: user.created_at,
    },
    recipients: recipients.data ?? [],
    wishlists: wishlists.data ?? [],
    wishlist_items: items.data ?? [],
    notifications: notifications.data ?? [],
  }

  return NextResponse.json(exportData)
}
