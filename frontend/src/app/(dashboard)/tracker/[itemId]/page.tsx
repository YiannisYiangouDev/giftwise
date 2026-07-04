import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { PriceHistoryChart } from '@/components/dashboard/PriceHistoryChart'
import { PriceDropBadge } from '@/components/dashboard/PriceDropBadge'
import { AlertToggle } from '@/components/dashboard/AlertToggle'
import type { PageProps } from '@/types/next'

export const dynamic = 'force-dynamic'

export default async function ItemDetailPage({ params }: PageProps<{ itemId: string }>) {
  const { itemId } = await params
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('wishlist_items')
    .select(`
      id, name, url, image_url,
      current_best_price, target_price,
      alert_enabled,
      wishlists ( name, recipients ( name ) )
    `)
    .eq('id', itemId)
    .single()

  if (!item) notFound()

  const { data: history } = await supabase
    .from('price_history')
    .select('recorded_at, price')
    .eq('item_id', itemId)
    .order('recorded_at', { ascending: true })
    .limit(90)

  const wl = item.wishlists as { name: string; recipients: { name: string } | null } | null
  const isPriceDrop =
    item.current_best_price != null &&
    item.target_price != null &&
    item.current_best_price < item.target_price

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/tracker"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          aria-label="Back to tracker"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <p className="text-xs text-gray-400 truncate">
            {wl?.recipients?.name ?? 'Unknown'} &middot; {wl?.name ?? 'Wishlist'}
          </p>
          <h1 className="text-lg font-bold leading-tight truncate">{item.name}</h1>
        </div>
      </div>

      {/* Price card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs text-gray-400 mb-1">Current best price</p>
            <p className="text-3xl font-bold tabular-nums">
              {item.current_best_price != null
                ? `\u20AC${Number(item.current_best_price).toFixed(2)}`
                : '\u2014'}
            </p>
            {isPriceDrop && item.current_best_price != null && item.target_price != null && (
              <div className="mt-2">
                <PriceDropBadge
                  currentPrice={Number(item.current_best_price)}
                  targetPrice={Number(item.target_price)}
                />
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400 mb-1">Your target</p>
            <p className="text-xl font-semibold tabular-nums text-gray-600 dark:text-gray-300">
              {item.target_price != null
                ? `\u20AC${Number(item.target_price).toFixed(2)}`
                : 'Not set'}
            </p>
          </div>
        </div>

        {history && history.length > 1 ? (
          <PriceHistoryChart
            data={history as { recorded_at: string; price: number }[]}
            targetPrice={item.target_price != null ? Number(item.target_price) : null}
          />
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-400">Not enough price history yet.</p>
            <p className="text-xs text-gray-300 mt-1">Check back after the next scrape run.</p>
          </div>
        )}
      </div>

      {/* Alert toggle */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-sm">Email alert</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Notify me when the price drops below my target
          </p>
        </div>
        <AlertToggle itemId={item.id} enabled={item.alert_enabled ?? false} />
      </div>

      {/* Store link */}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:underline"
        >
          View on store
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  )
}
