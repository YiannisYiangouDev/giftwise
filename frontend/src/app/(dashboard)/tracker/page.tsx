import { createClient } from '@/lib/supabase/server'
import { TrendingDown, TrendingUp, Minus, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import type { WishlistItemRow, WishlistItemWithWishlist } from '@/types/rows'
import EmptyState from '@/components/EmptyState'

export default async function TrackerPage() {
  const supabase = await createClient()
  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*, wishlists(title, recipients(name))')
    .order('created_at', { ascending: false })
    .returns<(WishlistItemRow & { wishlists: { title: string; recipients: { name: string } } | null })[]>()

  return (
    <div className="space-y-8 page-enter">
      <div>
        <h1 className="text-3xl font-normal tracking-wide">Price Tracker</h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Live price monitoring for tracked items</p>
      </div>

      <div className="space-y-3">
        {items?.map((item, i) => {
          const dropped = item.target_price && item.current_best_price && item.current_best_price <= item.target_price
          const Icon = dropped ? TrendingDown : item.current_best_price ? Minus : TrendingUp
          const priceDiff = item.target_price && item.current_best_price
            ? ((item.current_best_price - item.target_price) / item.target_price * 100).toFixed(0)
            : null

          return (
            <div key={item.id} className="card overflow-hidden group flex items-center"
              style={{ animationDelay: `${i * 40}ms` }}>
              <Link href={`/tracker/${item.id}`}
                className="flex-1 flex items-center gap-4 p-4 min-w-0 hover:bg-gray-50/40 dark:hover:bg-gray-800/10 transition-all duration-200">
                <SafeImage
                  src={item.image_url}
                  alt={item.product_name}
                  width={56}
                  height={56}
                  className="object-cover rounded-xl flex-shrink-0 border border-gray-100 dark:border-gray-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[15px] text-gray-800 dark:text-gray-200 truncate">{item.product_name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {(item as WishlistItemWithWishlist).wishlists?.recipients?.name} · {(item as WishlistItemWithWishlist).wishlists?.title}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 mr-3">
                  <p className={`text-lg font-light tracking-wide ${dropped ? 'text-emerald-500' : 'text-gray-700 dark:text-gray-300'}`}>
                    {item.current_best_price ? `€${item.current_best_price}` : '—'}
                  </p>
                  {item.target_price && (
                    <p className="text-[11px] text-gray-400">Target: €{item.target_price}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {priceDiff && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      Number(priceDiff) <= 0
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                    }`}>
                      {Number(priceDiff) > 0 ? '+' : ''}{priceDiff}%
                    </span>
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    dropped
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500'
                      : 'bg-gray-50 dark:bg-gray-800/30 text-gray-400'
                  }`}>
                    <Icon size={14} />
                  </div>
                </div>
              </Link>
              {item.product_url && (
                <a href={item.product_url} target="_blank" rel="noopener noreferrer"
                  className="text-gray-300 hover:text-brand-500 flex-shrink-0 p-4 pl-0 transition-colors duration-200">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          )
        })}
        {(!items || items.length === 0) && (
          <EmptyState type="tracker" />
        )}
      </div>
    </div>
  )
}
