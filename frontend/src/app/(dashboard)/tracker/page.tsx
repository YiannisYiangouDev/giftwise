import { createClient } from '@/lib/supabase/server'
import { TrendingDown, TrendingUp, Minus, Bell } from 'lucide-react'
import Link from 'next/link'

type PriceStatus = 'dropped' | 'risen' | 'unchanged'

function priceStatus(current: number | null, target: number | null): PriceStatus {
  if (!current || !target) return 'unchanged'
  if (current <= target) return 'dropped'
  if (current > target * 1.1) return 'risen'
  return 'unchanged'
}

const STATUS_ICON = {
  dropped: <TrendingDown size={16} className="text-green-500" />,
  risen: <TrendingUp size={16} className="text-red-400" />,
  unchanged: <Minus size={16} className="text-gray-400" />,
}

const STATUS_BADGE = {
  dropped: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  risen: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  unchanged: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
}

export default async function TrackerPage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('wishlist_items')
    .select('id, product_name, product_url, image_url, current_best_price, target_price, status, wishlist:wishlists(id, title, recipient:recipients(name))')
    .not('target_price', 'is', null)
    .order('current_best_price')

  const { data: alerts } = await supabase
    .from('price_alerts')
    .select('id, item_id, triggered_at, old_price, new_price, wishlist_item:wishlist_items(product_name)')
    .order('triggered_at', { ascending: false })
    .limit(10)

  const dropsCount = items?.filter(i => priceStatus(i.current_best_price, i.target_price) === 'dropped').length ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Price Tracker</h1>
        <p className="text-sm text-gray-500">Tracking {items?.length ?? 0} items with a target price</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Tracked items</p>
          <p className="text-2xl font-bold">{items?.length ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">At / below target</p>
          <p className="text-2xl font-bold text-green-600">{dropsCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Recent alerts</p>
          <p className="text-2xl font-bold text-brand-500">{alerts?.length ?? 0}</p>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold">Tracked Products</h2>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {items?.map(item => {
            const status = priceStatus(item.current_best_price, item.target_price)
            const pct = item.current_best_price && item.target_price
              ? Math.round(((item.current_best_price - item.target_price) / item.target_price) * 100)
              : null
            return (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt={item.product_name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-gray-100 dark:border-gray-800" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product_name}</p>
                  <p className="text-xs text-gray-400">
                    {/* @ts-ignore */}
                    {item.wishlist?.recipient?.name} &middot; {item.wishlist?.title}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    {STATUS_ICON[status]}
                    <span className="font-semibold text-sm">
                      {item.current_best_price ? `€${item.current_best_price}` : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">target €{item.target_price}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGE[status]}`}>
                    {status === 'dropped' && pct !== null ? `${Math.abs(pct)}% below` :
                     status === 'risen' && pct !== null ? `${pct}% above` : 'On track'}
                  </span>
                </div>
                <Link href={`/tracker/${item.id}`} className="text-xs text-brand-500 hover:text-brand-600 font-medium flex-shrink-0">
                  History →
                </Link>
              </div>
            )
          })}
          {(!items || items.length === 0) && (
            <div className="text-center py-16 text-gray-400 text-sm">
              No items with target prices yet. Set a target price on a wishlist item to start tracking.
            </div>
          )}
        </div>
      </div>

      {/* Recent alerts */}
      {alerts && alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Bell size={16} className="text-brand-500" />
            <h2 className="font-semibold">Recent Price Alerts</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {alerts.map(alert => (
              <div key={alert.id} className="px-6 py-3 flex items-center gap-4">
                <TrendingDown size={16} className="text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {/* @ts-ignore */}
                  <p className="text-sm font-medium truncate">{alert.wishlist_item?.product_name}</p>
                  <p className="text-xs text-gray-400">{new Date(alert.triggered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right text-sm flex-shrink-0">
                  <span className="line-through text-gray-400">€{alert.old_price}</span>
                  {' → '}
                  <span className="font-semibold text-green-600">€{alert.new_price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
