import { createClient } from '@/lib/supabase/server'
import { TrendingDown, TrendingUp, Minus, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { WishlistItemRow } from '@/types/rows'

export default async function TrackerPage() {
  const supabase = await createClient()
  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*, wishlists(title, recipients(name))')
    .order('created_at', { ascending: false })
    .returns<(WishlistItemRow & { wishlists: { title: string; recipients: { name: string } } | null })[]>()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Price Tracker</h1>
        <p className="text-gray-500 text-sm">Live price monitoring for all tracked items</p>
      </div>

      <div className="space-y-3">
        {items?.map(item => {
          const dropped = item.target_price && item.current_best_price && item.current_best_price <= item.target_price
          const Icon = dropped ? TrendingDown : item.current_best_price ? Minus : TrendingUp
          return (
            <div key={item.id}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 group">
              <Link href={`/tracker/${item.id}`}
                className="flex-1 flex items-center gap-4 p-4 min-w-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-l-xl transition">
                {item.image_url && (
                  <img src={item.image_url} alt={item.product_name}
                    className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.product_name}</p>
                  <p className="text-xs text-gray-500">
                    {(item.wishlists as any)?.recipients?.name} · {(item.wishlists as any)?.title}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-lg ${dropped ? 'text-green-500' : ''}`}>
                    {item.current_best_price ? `€${item.current_best_price}` : '—'}
                  </p>
                  {item.target_price && (
                    <p className="text-xs text-gray-400">Target: €{item.target_price}</p>
                  )}
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  dropped ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Icon size={16} />
                </div>
              </Link>
              {item.product_url && (
                <a href={item.product_url} target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-brand-500 flex-shrink-0 p-4 pl-0">
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          )
        })}
        {(!items || items.length === 0) && (
          <div className="text-center py-16 text-gray-400">
            <TrendingDown size={48} className="mx-auto mb-3 opacity-30" />
            <p>No tracked items yet. Add items to a wishlist to start tracking.</p>
          </div>
        )}
      </div>
    </div>
  )
}
