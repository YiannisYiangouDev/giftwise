import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Gift, ExternalLink, ShoppingBag } from 'lucide-react'
import type { PageProps } from '@/types/next'
import type { Database } from '@/types/database'

type Item = Database['public']['Tables']['wishlist_items']['Row']

const STATUS_LABELS: Record<string, string> = {
  wanted: 'Available',
  claimed: 'Claimed',
  purchased: 'Purchased',
  received: 'Received',
}

export default async function PublicWishlistPage({ params }: PageProps<{ token: string }>) {
  const { token } = await params
  const supabase = await createClient()

  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('*, recipients(name)')
    .eq('share_token', token)
    .eq('is_public', true)
    .single()

  if (!wishlist) notFound()

  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('wishlist_id', wishlist.id)
    .order('status', { ascending: true })

  const recipient = wishlist.recipients as { name: string } | null
  const available = (items ?? []).filter(i => i.status === 'wanted')
  const taken = (items ?? []).filter(i => i.status !== 'wanted')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-2">
        <ShoppingBag size={20} className="text-brand-500" />
        <span className="font-bold text-brand-600">GiftWise</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center mx-auto">
            <Gift size={28} className="text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold">{wishlist.title as string}</h1>
          {recipient && (
            <p className="text-gray-500 text-sm">Gift ideas for <strong>{recipient.name}</strong></p>
          )}
          {wishlist.occasion && (
            <span className="inline-block text-xs px-3 py-1 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded-full">
              {wishlist.occasion as string}
            </span>
          )}
        </div>

        {/* Available items */}
        {available.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Still available ({available.length})</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {available.map(item => <PublicItemCard key={item.id} item={item} />)}
            </div>
          </section>
        )}

        {/* Taken items */}
        {taken.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Already claimed ({taken.length})</h2>
            <div className="grid gap-3 sm:grid-cols-2 opacity-60">
              {taken.map(item => <PublicItemCard key={item.id} item={item} dimmed />)}
            </div>
          </section>
        )}

        {(!items || items.length === 0) && (
          <div className="text-center py-16 text-gray-400">
            <Gift size={40} className="mx-auto mb-3 opacity-30" />
            <p>No items on this list yet.</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pt-4">Shared via GiftWise</p>
      </main>
    </div>
  )
}

function PublicItemCard({ item, dimmed }: { item: Item; dimmed?: boolean }) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col ${
      dimmed ? 'opacity-70' : ''
    }`}>
      {item.image_url && (
        <div className="aspect-video bg-gray-50 dark:bg-gray-800 overflow-hidden">
          <img
            src={item.image_url}
            alt={item.product_name}
            className="w-full h-full object-contain p-2"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="font-medium text-sm leading-snug line-clamp-2">{item.product_name}</p>
        <div className="flex items-center justify-between mt-auto">
          {item.current_best_price != null ? (
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
              €{item.current_best_price.toFixed(2)}
            </span>
          ) : <span />}
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            item.status === 'wanted'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {STATUS_LABELS[item.status] ?? item.status}
          </span>
        </div>
        {item.notes && <p className="text-xs text-gray-400 line-clamp-1">{item.notes}</p>}
      </div>
      {item.product_url && (
        <a
          href={item.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-4 mb-4 flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-500 text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition"
        >
          View product <ExternalLink size={11} />
        </a>
      )}
    </div>
  )
}
