import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Gift, Calendar, History, Wallet, ExternalLink, Filter, CheckCircle2 } from 'lucide-react'
import SafeImage from '@/components/SafeImage'
import type { WishlistItemRow, WishlistWithRecipient } from '@/types/rows'

export default async function GiftHistoryPage() {
  const supabase = await createClient()

  // Fetch all purchased wishlist items with wishlist & recipient context
  const { data: rawItems } = await supabase
    .from('wishlist_items')
    .select('*, wishlists(title, occasion, event_date, recipients(name, relationship))')
    .in('status', ['purchased', 'claimed'])
    .order('updated_at', { ascending: false })

  const items = (rawItems ?? []) as (WishlistItemRow & {
    wishlists: {
      title: string
      occasion: string | null
      event_date: string | null
      recipients: { name: string; relationship: string | null } | null
    } | null
  })[]

  // Calculate statistics
  const totalSpent = items
    .filter(i => i.current_best_price || i.target_price)
    .reduce((sum, i) => sum + (i.current_best_price || i.target_price || 0), 0)

  const giftsGivenCount = items.length
  const avgGiftValue = giftsGivenCount > 0 ? (totalSpent / giftsGivenCount).toFixed(2) : '0.00'

  // Extract unique years & recipients
  const yearsSet = new Set<string>()
  const recipientsSet = new Set<string>()

  items.forEach(item => {
    const year = item.created_at ? new Date(item.created_at).getFullYear().toString() : '2026'
    yearsSet.add(year)
    if (item.wishlists?.recipients?.name) {
      recipientsSet.add(item.wishlists.recipients.name)
    }
  })

  const availableYears = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a))
  const availableRecipients = Array.from(recipientsSet).sort()

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="text-brand-500" size={24} />
            <h1 className="text-3xl font-normal tracking-wide text-gray-900 dark:text-white">
              Gift Exchange History
            </h1>
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Archive of all gifts given and claimed across previous holidays & occasions
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0 border border-brand-500/20">
            <Wallet size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Lifetime Gift Expenditure</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">€{totalSpent.toFixed(2)}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
            <Gift size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Gifts Given</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{giftsGivenCount}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Avg Gift Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">€{avgGiftValue}</p>
          </div>
        </div>
      </div>

      {/* History Items Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Past Gift Log ({items.length})</h2>
        </div>

        {items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map(item => {
              const price = item.current_best_price || item.target_price
              const recipientName = item.wishlists?.recipients?.name || 'Family Member'
              const occasion = item.wishlists?.occasion || item.wishlists?.title || 'Special Occasion'
              const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

              return (
                <div key={item.id} className="card p-5 flex flex-col justify-between space-y-4 transition hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <SafeImage
                      src={item.image_url}
                      alt={item.product_name}
                      width={64}
                      height={64}
                      className="object-cover rounded-xl border border-gray-100 dark:border-gray-800 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.status === 'purchased' ? 'badge-green' : 'badge-yellow'
                        }`}>
                          {item.status === 'purchased' ? 'Purchased' : `Claimed by ${item.claimed_by_name || 'Guest'}`}
                        </span>
                        {dateStr && <span className="text-[11px] text-gray-400">{dateStr}</span>}
                      </div>

                      <h3 className="font-medium text-base text-gray-900 dark:text-gray-100 truncate">
                        {item.product_name}
                      </h3>

                      <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>👤 {recipientName}</span>
                        <span>·</span>
                        <span>🎯 {occasion}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                      {price ? `€${price.toFixed(2)}` : 'Price not recorded'}
                    </span>

                    {item.product_url && (
                      <a
                        href={item.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
                      >
                        View Store <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 card border-dashed text-gray-400">
            <Gift size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium text-sm">No completed gifts in history log yet.</p>
            <p className="text-xs text-gray-500 mt-1">Mark items as purchased or claimed on your wishlists to view them here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
