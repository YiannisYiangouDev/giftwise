import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TrendingDown, ChevronRight, ExternalLink } from 'lucide-react'

export default async function PriceAlerts() {
  const supabase = await createClient()

  // Items where current price is at or below target
  const { data: drops } = await supabase
    .from('wishlist_items')
    .select('id, product_name, product_url, target_price, current_best_price, currency, wishlist_id')
    .not('target_price', 'is', null)
    .not('current_best_price', 'is', null)
    .order('current_best_price', { ascending: true })
    .limit(5)

  // Items being tracked but no price yet
  const { count: trackingCount } = await supabase
    .from('wishlist_items')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'purchased')
    .neq('status', 'received')

  const alertItems = (drops ?? []).filter(
    item => item.current_best_price != null && item.target_price != null &&
      Number(item.current_best_price) <= Number(item.target_price)
  )

  const savings = alertItems.reduce((sum, item) =>
    sum + (Number(item.target_price) - Number(item.current_best_price)), 0
  )

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <TrendingDown size={18} className="text-green-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Price Alerts</h3>
          {alertItems.length > 0 && (
            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium px-2 py-0.5 rounded-full">
              {alertItems.length} drop{alertItems.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Link href="/tracker" className="text-xs text-brand-500 hover:text-brand-600 font-medium">View all</Link>
      </div>

      {/* Summary strip */}
      {trackingCount != null && trackingCount > 0 && (
        <div className="mx-6 mt-4 mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Tracking <strong className="text-gray-700 dark:text-gray-200">{trackingCount}</strong> items</span>
          {savings > 0 && (
            <span className="text-green-600 dark:text-green-400 font-medium">Save up to €{savings.toFixed(2)}</span>
          )}
        </div>
      )}

      {alertItems.length > 0 ? (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800 px-6">
          {alertItems.map(item => {
            const saved = Number(item.target_price) - Number(item.current_best_price)
            const pct = Math.round((saved / Number(item.target_price)) * 100)
            return (
              <li key={item.id} className="py-3.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      €{Number(item.current_best_price).toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      €{Number(item.target_price).toFixed(2)}
                    </span>
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium px-1.5 py-0.5 rounded">
                      -{pct}%
                    </span>
                  </div>
                </div>
                <a
                  href={item.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1.5 text-gray-400 hover:text-brand-500 transition-colors"
                  aria-label="Open product"
                >
                  <ExternalLink size={14} />
                </a>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center py-10 px-6 text-center">
          <TrendingDown size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No price alerts yet</p>
          <p className="text-xs text-gray-400 mb-4">Add items to a wishlist and set a target price to track deals.</p>
          <Link href="/wishlists" className="btn-primary text-xs px-3 py-1.5">
            Add wishlist items
          </Link>
        </div>
      )}
    </div>
  )
}
