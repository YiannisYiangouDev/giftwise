import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Share2 } from 'lucide-react'
import AddItemForm from './AddItemForm'
import WishlistItem from './WishlistItem'
import ShareButton from './ShareButton'

export default async function WishlistDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('*, recipient:recipients(id, name)')
    .eq('id', params.id)
    .single()

  if (!wishlist) notFound()

  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('wishlist_id', params.id)
    .order('created_at')

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href={wishlist.recipient ? `/recipients/${(wishlist.recipient as { id: string }).id}` : '/wishlists'}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{wishlist.title}</h1>
          <p className="text-sm text-gray-500">
            {/* @ts-ignore */}
            {wishlist.recipient?.name}{wishlist.occasion ? ` · ${wishlist.occasion}` : ''}{wishlist.event_date ? ` · ${wishlist.event_date}` : ''}
          </p>
        </div>
        <ShareButton wishlistId={params.id} shareToken={wishlist.share_token} isPublic={wishlist.is_public} />
      </div>

      {/* Items grid */}
      <div className="space-y-3">
        {items?.map(item => (
          <WishlistItem key={item.id} item={item} />
        ))}
        {(!items || items.length === 0) && (
          <div className="text-center py-10 text-gray-400 text-sm">No items yet. Add the first one below!</div>
        )}
      </div>

      {/* Add item form */}
      <AddItemForm wishlistId={params.id} />
    </div>
  )
}
