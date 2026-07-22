import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, TrendingDown, ArrowLeft } from 'lucide-react'
import PriceHistoryChart from '@/components/PriceHistoryChart'
import type { PriceHistoryRow, WishlistItemWithWishlist } from '@/types/rows'

export default async function TrackerItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('wishlist_items')
    .select('*, wishlists(title, recipients(name))')
    .eq('id', id)
    .single()

  if (!item) notFound()

  const { data: history } = await supabase
    .from('price_history')
    .select('*')
    .eq('item_id', id)
    .order('checked_at', { ascending: true })
    .limit(100)

  const dropped = item.target_price && item.current_best_price && item.current_best_price <= item.target_price


  const lowestPrice = history?.length ? Math.min(...history.map(h => h.price)) : item.current_best_price
  const highestPrice = history?.length ? Math.max(...history.map(h => h.price)) : item.current_best_price
  const priceChange = history && history.length >= 2
    ? history[history.length - 1].price - history[0].price
    : 0

  return (
    <div className="space-y-6">
      <Link href="/tracker" className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500">
        <ArrowLeft size={14} /> Back to Tracker
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border">
        <div className="flex items-start gap-4">
          {item.image_url && <Image src={item.image_url} alt={item.product_name} width={80} height={80} className="object-cover rounded-xl flex-shrink-0" />}
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-1">{item.product_name}</h1>
            <p className="text-sm text-gray-500">
              {(item as WishlistItemWithWishlist).wishlists?.recipients?.name} · {(item as WishlistItemWithWishlist).wishlists?.title}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div>
                <p className="text-xs text-gray-500">Current Price</p>
                <p className={`text-2xl font-bold ${dropped ? 'text-green-500' : ''}`}>
                  {item.current_best_price ? `€${item.current_best_price}` : '—'}
                </p>
              </div>
              {item.target_price && (
                <div>
                  <p className="text-xs text-gray-500">Target</p>
                  <p className="text-2xl font-bold text-brand-500">€{item.target_price}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <span className={`px-2 py-0.5 rounded text-sm font-medium ${
                  item.status === 'wanted' ? 'bg-blue-100 text-blue-700' :
                  item.status === 'claimed' ? 'bg-yellow-100 text-yellow-700' :
                  item.status === 'purchased' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{item.status}</span>
              </div>
            </div>
          </div>
          {item.product_url && (
            <a href={item.product_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-4 py-2 bg-brand-500 text-white text-sm rounded-lg hover:bg-brand-600 transition">
              <ExternalLink size={14} /> View Product
            </a>
          )}
        </div>
      </div>

      {/* Price stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Checks', value: history?.length ?? 0 },
          { label: 'Lowest', value: lowestPrice ? `€${lowestPrice}` : '—' },
          { label: 'Highest', value: highestPrice ? `€${highestPrice}` : '—' },
          { label: 'Change', value: priceChange ? `${priceChange > 0 ? '+' : ''}€${priceChange.toFixed(2)}` : '—' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border text-center">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-lg font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Price history chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="font-semibold mb-4">Price History</h2>
        <PriceHistoryChart
          history={(history as PriceHistoryRow[]) ?? []}
          targetPrice={item.target_price ? Number(item.target_price) : null}
        />
      </div>

      {/* History table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Recent Checks</h2>
        </div>
        <div className="divide-y">
          {history?.slice().reverse().map(h => (
            <div key={h.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">€{h.price}</p>
                <p className="text-xs text-gray-500">{h.store_name}</p>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>{new Date(h.checked_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                <p>{h.in_stock ? '✅ In stock' : '❌ Out of stock'}</p>
              </div>
            </div>
          ))}
          {(!history || history.length === 0) && (
            <p className="text-center py-8 text-gray-400 text-sm">No price history yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
