import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Edit, ExternalLink, Plus, User } from 'lucide-react'
import AddItemForm from '@/components/AddItemForm'
import ContributionPanel from '@/components/ContributionPanel'
import type { WishlistRow, WishlistItemRow } from '@/types/rows'
import DeleteItemButton from './DeleteItemButton'
import ItemStatusButton from '@/components/ItemStatusButton'
import ShareWishlistButton from '@/components/ShareWishlistButton'

export default async function WishlistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: wishlistData } = await supabase
    .from('wishlists')
    .select('*, recipients(name)')
    .eq('id', id)
    .single()
  const wishlist = wishlistData as (WishlistRow & { recipients: { name: string } | null }) | null
  if (!wishlist) notFound()

  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('wishlist_id', id)
    .order('created_at', { ascending: false })
    .returns<WishlistItemRow[]>()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{wishlist.title}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User size={14} /> {(wishlist.recipients as any)?.name}
            </span>
            {wishlist.occasion && <span>🎯 {wishlist.occasion}</span>}
            {wishlist.event_date && <span>📅 {wishlist.event_date}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <ShareWishlistButton
            wishlistId={id}
            shareToken={wishlist.share_token}
            isPublic={wishlist.is_public}
          />
          <Link href={`/wishlists/${id}/edit`}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <Edit size={14} /> Edit
          </Link>
        </div>
      </div>

      {/* Add Item */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Plus size={16} className="text-brand-500" /> Add Product by URL
        </h2>
        <AddItemForm wishlistId={id} />
      </div>

      {/* Items */}
      <div>
        <h2 className="text-sm font-semibold mb-3">
          Items {items?.length ? `(${items.length})` : ''}
        </h2>
        <div className="space-y-2">
          {items?.map(item => (
            <div key={item.id}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="p-4 flex items-center gap-4">
                {item.image_url && (
                  <img src={item.image_url} alt={item.product_name}
                    className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.product_name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>€{item.current_best_price ?? '—'}</span>
                    {item.target_price && (
                      <span className="text-brand-500">Target: €{item.target_price}</span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      item.status === 'wanted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      item.status === 'claimed' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      item.status === 'purchased' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>{item.status}</span>
                  </div>
                </div>
                {item.product_url && (
                  <a href={item.product_url} target="_blank" rel="noopener noreferrer"
                    className="text-gray-400 hover:text-brand-500 flex-shrink-0">
                    <ExternalLink size={16} />
                  </a>
                )}
                <ItemStatusButton itemId={item.id} currentStatus={item.status} />
                <DeleteItemButton itemId={item.id} productName={item.product_name} />
              </div>
              <div className="px-4 pb-3">
                <ContributionPanel
                  itemId={item.id}
                  totalContributed={item.current_best_price ?? 0}
                  isGroupGift={(item as any).is_group_gift ?? false}
                />
              </div>
            </div>
          ))}

          {(!items || items.length === 0) && (
            <div className="text-center py-12 text-gray-400">
              <Plus size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No items yet. Paste a product URL above to start tracking.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}