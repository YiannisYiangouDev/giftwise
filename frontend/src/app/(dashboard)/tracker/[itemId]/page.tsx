import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PriceHistoryChart from './PriceHistoryChart'

export default async function PriceHistoryPage({ params }: { params: { itemId: string } }) {
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('wishlist_items')
    .select('id, product_name, product_url, image_url, current_best_price, target_price, wishlist:wishlists(title, recipient:recipients(name))')
    .eq('id', params.itemId)
    .single()

  if (!item) notFound()

  const { data: history } = await supabase
    .from('price_history')
    .select('price, scraped_at, store_name')
    .eq('item_id', params.itemId)
    .order('scraped_at', { ascending: true })
    .limit(90)

  const chartData = history?.map(h => ({
    date: new Date(h.scraped_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    price: parseFloat(h.price),
    store: h.store_name,
  })) ?? []

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/tracker" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold truncate">{item.product_name}</h1>
          <p className="text-sm text-gray-500">
            {/* @ts-ignore */}
            {item.wishlist?.recipient?.name} &middot; {item.wishlist?.title}
          </p>
        </div>
        {item.product_url && (
          <a href={item.product_url} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            View product →
          </a>
        )}
      </div>

      {/* Price summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Current best price</p>
          <p className="text-3xl font-bold">{item.current_best_price ? `€${item.current_best_price}` : '—'}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Your target price</p>
          <p className="text-3xl font-bold text-brand-500">{item.target_price ? `€${item.target_price}` : '—'}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
        <h2 className="font-semibold mb-4">Price History (last 90 days)</h2>
        {chartData.length > 1 ? (
          <PriceHistoryChart data={chartData} targetPrice={item.target_price} />
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Not enough data yet. Prices are checked daily.
          </div>
        )}
      </div>
    </div>
  )
}
