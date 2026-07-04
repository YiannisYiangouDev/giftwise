import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('id, share_token, is_public, recipients(user_id)')
    .eq('id', id)
    .single()

  if (!wishlist) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const rec = wishlist.recipients as { user_id: string } | null
  if (rec?.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Already shared — just return the existing token
  if (wishlist.is_public && wishlist.share_token) {
    return NextResponse.json({ token: wishlist.share_token })
  }

  const token = randomUUID()
  const { error } = await supabase
    .from('wishlists')
    .update({ is_public: true, share_token: token })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ token })
}
