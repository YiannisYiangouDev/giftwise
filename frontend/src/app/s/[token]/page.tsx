import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Gift } from 'lucide-react'
import SharedWishlistItems from '@/components/SharedWishlistItems'
import type { WishlistItemRow, WishlistWithRecipient } from '@/types/rows'

interface Props { params: Promise<{ token: string }> }

export default async function SharedWishlistPage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('*, recipients(name, relationship)')
    .eq('share_token', token)
    .eq('is_public', true)
    .single()

  if (!wishlist) notFound()
  const wl = wishlist as WishlistWithRecipient

  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('wishlist_id', wishlist.id)
    .order('created_at', { ascending: false })
    .returns<WishlistItemRow[]>()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-purple-50 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl mb-4 shadow-md shadow-brand-500/20">
            <Gift size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{wishlist.title}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {wl.recipients?.name}&apos;s Wishlist
            {wishlist.occasion && ` · ${wishlist.occasion}`}
          </p>
        </div>

        <SharedWishlistItems initialItems={items ?? []} wishlistId={wishlist.id} />
      </div>
    </div>
  )
}
