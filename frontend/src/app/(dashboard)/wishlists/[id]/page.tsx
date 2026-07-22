import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import { Edit, ExternalLink, Plus } from 'lucide-react'
import AddItemForm from '@/components/AddItemForm'
import ContributionPanel from '@/components/ContributionPanel'
import type { WishlistItemRow, WishlistWithRecipient, RecipientRow } from '@/types/rows'
import DeleteItemButton from './DeleteItemButton'
import ItemStatusButton from '@/components/ItemStatusButton'
import ShareWishlistButton from '@/components/ShareWishlistButton'
import AIRecommendationsButton from './AIRecommendationsButton'

import PrintableWishlistButton from '@/components/PrintableWishlistButton'

export default async function WishlistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('*, recipients(name, relationship, birthday, notes, budget_min, budget_max)')
    .eq('id', id)
    .single()
  if (!wishlist) notFound()
  const wl = wishlist as unknown as WishlistWithRecipient

  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('wishlist_id', id)
    .order('created_at', { ascending: false })
    .returns<WishlistItemRow[]>()

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-normal tracking-wide">{wishlist.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-400">
            <span className="flex items-center gap-1">👤 {wl.recipients?.name}</span>
            {wl.occasion && <span>🎯 {wl.occasion}</span>}
            {wl.event_date && <span>📅 {wl.event_date}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {wl.recipients && (
            <AIRecommendationsButton wishlistId={id} recipient={wl.recipients as unknown as RecipientRow} />
          )}
          <ShareWishlistButton wishlistId={id} shareToken={wl.share_token} isPublic={wl.is_public} />
          <PrintableWishlistButton />
          <Link href={`/wishlists/${id}/edit`} className="btn-secondary !py-2 !px-4 !text-xs">
            <Edit size={14} /> Edit
          </Link>
        </div>
      </div>

      {/* Add Item */}
      <div className="glass p-6">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Plus size={16} className="text-brand-500" /> Add Product
        </h2>
        <AddItemForm wishlistId={id} />
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">
            Items {items?.length ? `(${items.length})` : ''}
          </h2>
        </div>
        <div className="space-y-3">
          {items?.map(item => (
            <div key={item.id} className="card overflow-hidden">
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <SafeImage
                    src={item.image_url}
                    alt={item.product_name}
                    width={64}
                    height={64}
                    className="object-cover rounded-xl flex-shrink-0 border border-gray-100 dark:border-gray-800"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[15px] text-gray-800 dark:text-gray-200 truncate">{item.product_name}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1.5">
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        {item.current_best_price ? `€${item.current_best_price}` : '—'}
                      </span>
                      {item.target_price && (
                        <span className="text-brand-500">Target: €{item.target_price}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.status === 'wanted' ? 'badge-blue' :
                        item.status === 'claimed' ? 'badge-yellow' :
                        item.status === 'purchased' ? 'badge-green' :
                        'badge-gray'
                      }`}>
                        {item.status === 'claimed' && item.claimed_by_name ? `Claimed by ${item.claimed_by_name}` :
                         item.status === 'purchased' && item.claimed_by_name ? `Purchased by ${item.claimed_by_name}` :
                         item.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1.5 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 dark:border-gray-800/60">
                  {item.product_url && (
                    <a href={item.product_url} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg text-gray-300 hover:text-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 transition-all duration-200">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <ItemStatusButton itemId={item.id} currentStatus={item.status} />
                  <DeleteItemButton itemId={item.id} productName={item.product_name} />
                </div>
              </div>
              <div className="px-4 pb-4">
                <ContributionPanel
                  itemId={item.id}
                  totalContributed={item.current_best_price ?? 0}
                  isGroupGift={(item as unknown as { is_group_gift?: boolean }).is_group_gift ?? false}
                />
              </div>
            </div>
          ))}

          {(!items || items.length === 0) && (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800/40 flex items-center justify-center mx-auto mb-4">
                <Plus size={22} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm text-gray-400">No items yet. Add a product above to start tracking.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}