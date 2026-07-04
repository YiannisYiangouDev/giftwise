import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, List, CalendarDays } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const OCCASION_COLORS: Record<string, string> = {
  Birthday: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  Christmas: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Anniversary: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Wedding: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Graduation: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
}

export const dynamic = 'force-dynamic'

export default async function WishlistsPage({
  searchParams,
}: {
  searchParams: Promise<{ occasion?: string; recipient?: string }>
}) {
  const { occasion, recipient } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('wishlists')
    .select('*, recipients(id, name)')
    .order('event_date', { ascending: true, nullsFirst: false })

  if (occasion) query = query.eq('occasion', occasion)
  if (recipient) query = query.eq('recipient_id', recipient)

  const { data: wishlists } = await query

  // Counts per item
  const wishlistIds = (wishlists ?? []).map(w => w.id)
  const { data: itemCounts } = wishlistIds.length
    ? await supabase
        .from('wishlist_items')
        .select('wishlist_id')
        .in('wishlist_id', wishlistIds)
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const row of itemCounts ?? []) {
    countMap[row.wishlist_id] = (countMap[row.wishlist_id] ?? 0) + 1
  }

  // Unique occasions for filter
  const occasions = Array.from(new Set((wishlists ?? []).map(w => w.occasion).filter(Boolean)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wishlists</h1>
          <p className="text-gray-500 text-sm">All gift lists across every recipient</p>
        </div>
      </div>

      {/* Occasion filter chips */}
      {occasions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/wishlists"
            className={`text-xs px-3 py-1 rounded-full border transition ${
              !occasion
                ? 'bg-brand-500 text-white border-brand-500'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-brand-400'
            }`}
          >
            All
          </Link>
          {occasions.map(occ => (
            <Link
              key={occ as string}
              href={`/wishlists?occasion=${encodeURIComponent(occ as string)}`}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                occasion === occ
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-brand-400'
              }`}
            >
              {occ as string}
            </Link>
          ))}
        </div>
      )}

      {/* Grid */}
      {wishlists && wishlists.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wishlists.map(w => {
            const rec = w.recipients as { id: string; name: string } | null
            const itemCount = countMap[w.id] ?? 0
            const occ = w.occasion as string | null
            return (
              <Link
                key={w.id}
                href={`/wishlists/${w.id}`}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md transition flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold leading-snug">{w.title as string}</p>
                  {occ && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      OCCASION_COLORS[occ] ?? OCCASION_COLORS.Other
                    }`}>
                      {occ}
                    </span>
                  )}
                </div>
                {rec && (
                  <p className="text-sm text-gray-500">For {rec.name}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-auto">
                  <span className="flex items-center gap-1">
                    <List size={12} /> {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </span>
                  {w.event_date && (
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} />
                      {format(parseISO(w.event_date as string), 'MMM d, yyyy')}
                    </span>
                  )}
                  {w.is_public && (
                    <span className="text-green-500">Shared</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <List size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No wishlists yet.</p>
          <Link href="/recipients" className="text-brand-500 text-sm hover:underline mt-1 inline-block">
            Go to a recipient to create one →
          </Link>
        </div>
      )}
    </div>
  )
}
